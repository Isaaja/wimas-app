from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import re 
from datetime import datetime
from google import genai
from pypdf import PdfReader
import tempfile

app = Flask(__name__)
CORS(app)

from dotenv import load_dotenv

# Load variabel environment dari file .env
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("❌ API key tidak ditemukan. Pastikan file .env sudah dibuat dan berisi GEMINI_API_KEY.")

client = genai.Client(api_key=API_KEY)

def remove_degrees_from_name(name):
    """
    Menghapus gelar dari nama menggunakan tanda koma sebagai patokan
    Contoh: 
    - "Kuswahyudi, S.Kom., M.M." -> "Kuswahyudi"
    - "Purwanto, S.E." -> "Purwanto"
    - "Agung Suryo Wibowo, S.Kom., M.T." -> "Agung Suryo Wibowo"
    """
    if not name or not isinstance(name, str):
        return name
    
    # Split berdasarkan koma dan ambil bagian pertama
    parts = name.split(',')
    if parts:
        # Ambil bagian pertama dan hilangkan spasi di ujung
        clean_name = parts[0].strip()
        return clean_name
    
    return name

def clean_extracted_text(text):
    if not text:
        return text
    
    lines = text.split('\n')
    cleaned_lines = []
    
    unwanted_patterns = [
        r'^Semarang,?\s*\d{1,2}\s+\w+\s+\d{4}',
        r'^Kepala Balai Monitor',
        r'^Kepala Balmon',
        r'^Supriadi, S\.H\., M\.H\.',
        r'^Casual',
        r'^Casuala',
        r'^\*.*\d{4}.*\*',
        r'^Dokumen.*elektronik',
        r'^===== Page \d+ =====',
    ]
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        is_unwanted = False
        for pattern in unwanted_patterns:
            if re.search(pattern, line_clean, re.IGNORECASE):
                is_unwanted = True
                break
        
        if not is_unwanted:
            cleaned_lines.append(line_clean)
    
    cleaned_text = '\n'.join(cleaned_lines)
    return cleaned_text

def convert_date_format(date_string):
    try:
        pattern = r'(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s+s\.d\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})'
        match = re.search(pattern, date_string, re.IGNORECASE)
        
        if match:
            day_start, month_start, year_start, day_end, month_end, year_end = match.groups()
            
            bulan_map = {
                'januari': 'january', 'februari': 'february', 'maret': 'march',
                'april': 'april', 'mei': 'may', 'juni': 'june',
                'juli': 'july', 'agustus': 'august', 'september': 'september',
                'oktober': 'october', 'november': 'november', 'desember': 'december'
            }
            
            month_start_en = bulan_map.get(month_start.lower(), month_start.lower())
            month_end_en = bulan_map.get(month_end.lower(), month_end.lower())
            
            start_date = f"{year_start}-{month_start_en.capitalize()}-{day_start.zfill(2)}"
            end_date = f"{year_end}-{month_end_en.capitalize()}-{day_end.zfill(2)}"
            
            start_datetime = datetime.strptime(start_date, "%Y-%B-%d")
            end_datetime = datetime.strptime(end_date, "%Y-%B-%d")
            
            return {
                "start_date": start_datetime.strftime("%Y-%m-%d"),
                "end_date": end_datetime.strftime("%Y-%m-%d")
            }
        else:
            return {"start_date": "", "end_date": ""}
            
    except Exception:
        return {"start_date": "", "end_date": ""}

def extract_text_from_pdf(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception:
        return None

def pre_validate_spt_text(text):
    if not text:
        return False, "Teks kosong."
        
    text_upper = text.upper() 
        
    if "SURAT TUGAS" not in text_upper:
        return False, "Dokumen bukan Surat Tugas"
        
    pattern = r"NOMOR.*BALMON\.33"
    
    if not re.search(pattern, text_upper, re.DOTALL):
        return False, "Nomor surat tidak sesuai format"
        
    return True, "Validasi awal berhasil"

def validate_personil_list(personil_list):
    if not personil_list:
        return []
    
    filtered_personil = []
    
    unwanted_names = [
        'supriadi, s.h., m.h.',
        'kepala balai',
        'kepala balmon',
        'supriadi',
        'kepala'
    ]
    
    for person in personil_list:
        if not isinstance(person, str):
            continue
            
        person_lower = person.lower().strip()
        
        if any(unwanted in person_lower for unwanted in unwanted_names):
            continue
            
        if ',' in person and len(person) > 5:
            # Simpan nama asli untuk diproses nanti
            filtered_personil.append(person.strip())
    
    return filtered_personil

def remove_degrees_from_personil_list(personil_list):
    """
    Menghapus gelar dari semua nama dalam list personil
    """
    if not personil_list:
        return []
    
    clean_personil = []
    for person in personil_list:
        clean_name = remove_degrees_from_name(person)
        clean_personil.append(clean_name)
    
    return clean_personil

def analyze_text_with_llm(extracted_text):
    if not extracted_text:
        return None

    system_instruction = (
        "Anda adalah parser data yang sangat akurat untuk Surat Tugas (SPT). "
        "Tugas Anda HANYA mengekstrak informasi dari BAGIAN UTAMA surat. "
        "ABAIKAN sepenuhnya: tanda tangan, footer, header berulang, dan elemen di luar konten utama. "
        "Untuk daftar personil, ambil HANYA dari tabel yang ada di lampiran. "
        "ABAIKAN nama di bagian tanda tangan seperti 'Supriadi, S.H., M.H.'. "
        "JIKA SEBUAH DATA TIDAK DITEMUKAN, isi dengan string kosong (\" \"). "
        "JANGAN sertakan teks atau penjelasan lain di luar blok JSON."
    )
    
    user_prompt = f"""
      EKSTRAK INFORMASI dari teks Surat Tugas di bawah:
      
      INFORMASI YANG DIEKSTRAK:
      1. Nomor Surat (Nomor SPT)
      2. Tanggal Pelaksanaan (Format: DD MMMM YYYY s.d DD MMMM YYYY)
      3. Tempat Pelaksanaan
      4. Tujuan/Kegiatan
      5. Daftar Nama Personil (HANYA dari tabel lampiran)
      
      Output HARUS dalam format JSON:
      {{
        "nomor_surat": "...",
        "tanggal_pelaksanaan": "...", 
        "tempat_pelaksanaan": "...",
        "tujuan_kegiatan": "...",
        "personil": ["Nama 1", "Nama 2", ...]
      }}
      
      TEKS SURAT TUGAS:
      ---
      {extracted_text}
      ---
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_prompt,
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json", 
            }
        )
        
        json_string = response.text.strip()
        if json_string.startswith("```json"):
             json_string = json_string.strip("```json").strip()
        if json_string.endswith("```"):
             json_string = json_string.strip("```").strip()

        extracted_data = json.loads(json_string)
        
        if 'personil' in extracted_data:
            # Validasi personil terlebih dahulu
            extracted_data['personil'] = validate_personil_list(extracted_data['personil'])
            # Kemudian hapus gelar dari nama personil
            extracted_data['personil'] = remove_degrees_from_personil_list(extracted_data['personil'])
        
        if extracted_data.get('tanggal_pelaksanaan'):
            date_conversion = convert_date_format(extracted_data['tanggal_pelaksanaan'])
            extracted_data['start_date'] = date_conversion['start_date']
            extracted_data['end_date'] = date_conversion['end_date']
        else:
            extracted_data['start_date'] = ""
            extracted_data['end_date'] = ""
            
        return extracted_data

    except Exception as e:
        print(f"❌ Error in analyze_text_with_llm: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return None

def create_final_output(extracted_data):
    if not extracted_data:
        return None
    
    final_output = {
        "user": extracted_data.get('personil', []),
        "report": {
            "spt_number": extracted_data.get('nomor_surat', ''),
            "destination": extracted_data.get('tujuan_kegiatan', ''),
            "place_of_execution": extracted_data.get('tempat_pelaksanaan', ''),
            "start_date": extracted_data.get('start_date', ''),
            "end_date": extracted_data.get('end_date', '')
        }
    }
    
    return final_output

@app.route('/')
def home():
    return jsonify({"message": "SPT Processing API is running"})

@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    try:
        if 'pdf' not in request.files:
            return jsonify({'error': 'No PDF file uploaded'}), 400
        
        pdf_file = request.files['pdf']
        
        if pdf_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not pdf_file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'File must be a PDF'}), 400
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            pdf_file.save(temp_file.name)
            temp_path = temp_file.name
            
        try:
            print(f"📄 Processing PDF: {pdf_file.filename}")
            text = extract_text_from_pdf(temp_path)
            
            if not text or not text.strip():
                print("❌ PDF is empty")
                return jsonify({'error': 'Empty PDF'}), 400
            
            print(f"✅ Extracted text length: {len(text)} characters")
            cleaned_text = clean_extracted_text(text)
            
            if not cleaned_text or not cleaned_text.strip():
                print("❌ Text empty after cleaning")
                return jsonify({'error': 'Empty text after cleaning'}), 400
            
            print(f"✅ Cleaned text length: {len(cleaned_text)} characters")
            is_valid, validation_message = pre_validate_spt_text(cleaned_text)
            
            if not is_valid:
                print(f"❌ Validation failed: {validation_message}")
                return jsonify({"error": "Invalid SPT Document", "details": validation_message}), 400
            
            print("✅ Pre-validation passed")
            
            extracted_data = analyze_text_with_llm(cleaned_text)
            
            if not extracted_data:
                print("⚠️ analyze_text_with_llm returned None")
                return jsonify({"error": "Analysis Failed", "details": "LLM extraction returned empty data"}), 500
            
            final_nomor_surat = extracted_data.get('nomor_surat', '')
            if "BALMON.33" not in final_nomor_surat.upper():
                return jsonify({"error": "Invalid SPT Format"}), 400
            
            final_output = create_final_output(extracted_data)
            
            if not final_output:
                return jsonify({"error": "Processing Error"}), 500
            
            print(f"✅ Successfully processed. User count: {len(final_output['user'])}")
            print(f"✅ User names (without degrees): {final_output['user']}")
            
            return jsonify(final_output)
                
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)