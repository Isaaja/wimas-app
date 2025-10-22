import { GoogleGenerativeAI } from '@google/generative-ai';

// Konfigurasi API Key
const API_KEY = "AIzaSyBNYLMMHHBXlw8t4PwOrqJFD5JaKhabbTA";
const genAI = new GoogleGenerativeAI(API_KEY);

// Interface untuk data SPT
interface SPTData {
  nomor_surat: string;
  tanggal_pelaksanaan: string;
  tempat_pelaksanaan: string;
  tujuan_kegiatan: string;
  personil: string[];
}

interface ProcessedData {
  user: string[];
  report: {
    spt_number: string;
    destination: string;
    place_of_execution: string;
    start_date: string;
    end_date: string;
  };
}

interface DateConversion {
  start_date: string;
  end_date: string;
}

// Fungsi untuk membersihkan teks
function cleanExtractedText(text: string): string {
  if (!text) return text;

  const lines = text.split('\n');
  const cleanedLines: string[] = [];

  const unwantedPatterns = [
    /^Semarang,?\s*\d{1,2}\s+\w+\s+\d{4}/,
    /^Kepala Balai Monitor/,
    /^Kepala Balmon/,
    /^Supriadi, S\.H\., M\.H\./,
    /^Casual/,
    /^Casuala/,
    /^\*.*\d{4}.*\*/,
    /^Dokumen.*elektronik/,
    /^===== Page \d+ =====/,
  ];

  for (const line of lines) {
    const lineClean = line.trim();
    if (!lineClean) continue;

    let isUnwanted = false;
    for (const pattern of unwantedPatterns) {
      if (pattern.test(lineClean)) {
        isUnwanted = true;
        break;
      }
    }

    if (!isUnwanted) {
      cleanedLines.push(lineClean);
    }
  }

  return removeDuplicateHeaders(cleanedLines.join('\n'));
}

function removeDuplicateHeaders(text: string): string {
  const lines = text.split('\n');
  const uniqueLines: string[] = [];
  const seenHeaders = new Set<string>();

  const headerPatterns = [
    'KEMENTERIAN KOMUNIKASI DAN INFORMATIKA RI',
    'DIREKTORAT JENDERAL SUMBER DAYA',
    'BALAI MONITOR',
    'SURAT TUGAS',
    'Nomor :'
  ];

  for (const line of lines) {
    const lineClean = line.trim();
    const isHeader = headerPatterns.some(header => lineClean.includes(header));

    if (isHeader) {
      if (seenHeaders.has(lineClean)) {
        continue;
      }
      seenHeaders.add(lineClean);
    }

    uniqueLines.push(lineClean);
  }

  return uniqueLines.join('\n');
}

// Fungsi konversi tanggal
function convertDateFormat(dateString: string): DateConversion {
  try {
    const pattern = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s+s\.d\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i;
    const match = dateString.match(pattern);

    if (match) {
      const [, dayStart, monthStart, yearStart, dayEnd, monthEnd, yearEnd] = match;

      const bulanMap: { [key: string]: string } = {
        'januari': 'january', 'februari': 'february', 'maret': 'march',
        'april': 'april', 'mei': 'may', 'juni': 'june',
        'juli': 'july', 'agustus': 'august', 'september': 'september',
        'oktober': 'october', 'november': 'november', 'desember': 'december'
      };

      const monthStartEn = bulanMap[monthStart.toLowerCase()] || monthStart.toLowerCase();
      const monthEndEn = bulanMap[monthEnd.toLowerCase()] || monthEnd.toLowerCase();

      const startDate = `${yearStart}-${monthStartEn.charAt(0).toUpperCase() + monthStartEn.slice(1)}-${dayStart.padStart(2, '0')}`;
      const endDate = `${yearEnd}-${monthEndEn.charAt(0).toUpperCase() + monthEndEn.slice(1)}-${dayEnd.padStart(2, '0')}`;

      // Validasi dengan Date object
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      return {
        start_date: startDateTime.toISOString().split('T')[0],
        end_date: endDateTime.toISOString().split('T')[0]
      };
    } else {
      return { start_date: "", end_date: "" };
    }
  } catch (error) {
    return { start_date: "", end_date: "" };
  }
}

// Fungsi validasi SPT
function preValidateSptText(text: string): { isValid: boolean; message: string } {
  if (!text) {
    return { isValid: false, message: "Teks kosong." };
  }

  const textUpper = text.toUpperCase();

  if (!textUpper.includes("SURAT TUGAS")) {
    return { isValid: false, message: "Dokumen bukan Surat Tugas" };
  }

  const pattern = /NOMOR.*BALMON\.33/;
  if (!pattern.test(textUpper)) {
    return { isValid: false, message: "Nomor surat tidak sesuai format" };
  }

  return { isValid: true, message: "Validasi awal berhasil" };
}

// Fungsi validasi personil
function validatePersonilList(personilList: string[]): string[] {
  if (!personilList) return [];

  const filteredPersonil: string[] = [];

  const unwantedNames = [
    'supriadi, s.h., m.h.',
    'kepala balai',
    'kepala balmon',
    'supriadi',
    'kepala'
  ];

  for (const person of personilList) {
    if (typeof person !== 'string') continue;

    const personLower = person.toLowerCase().trim();

    if (unwantedNames.some(unwanted => personLower.includes(unwanted))) {
      continue;
    }

    if (person.includes(',') && person.length > 5) {
      filteredPersonil.push(person.trim());
    }
  }

  return filteredPersonil;
}

// Fungsi analisis dengan LLM
async function analyzeTextWithLLM(extractedText: string): Promise<SPTData | null> {
  if (!extractedText) return null;

  const systemInstruction = `
    Anda adalah parser data yang sangat akurat untuk Surat Tugas (SPT). 
    Tugas Anda HANYA mengekstrak informasi dari BAGIAN UTAMA surat. 
    ABAIKAN sepenuhnya: tanda tangan, footer, header berulang, dan elemen di luar konten utama. 
    Untuk daftar personil, ambil HANYA dari tabel yang ada di lampiran. 
    ABAIKAN nama di bagian tanda tangan seperti 'Supriadi, S.H., M.H.'. 
    JIKA SEBUAH DATA TIDAK DITEMUKAN, isi dengan string kosong (""). 
    JANGAN sertakan teks atau penjelasan lain di luar blok JSON.
  `;

  const userPrompt = `
    EKSTRAK INFORMASI dari teks Surat Tugas di bawah:

    INFORMASI YANG DIEKSTRAK:
    1. Nomor Surat (Nomor SPT)
    2. Tanggal Pelaksanaan (Format: DD MMMM YYYY s.d DD MMMM YYYY)
    3. Tempat Pelaksanaan
    4. Tujuan/Kegiatan
    5. Daftar Nama Personil (HANYA dari tabel lampiran)

    Output HARUS dalam format JSON:
    {
      "nomor_surat": "...",
      "tanggal_pelaksanaan": "...", 
      "tempat_pelaksanaan": "...",
      "tujuan_kegiatan": "...",
      "personil": ["Nama 1", "Nama 2", ...]
    }

    TEKS SURAT TUGAS:
    ---
    ${extractedText}
    ---
  `;

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    let jsonString = response.text().trim();

    // Clean JSON string
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.replace("```json", "").replace("```", "").trim();
    }

    const extractedData: SPTData = JSON.parse(jsonString);

    // Validasi personil
    extractedData.personil = validatePersonilList(extractedData.personil);

    // Konversi tanggal
    if (extractedData.tanggal_pelaksanaan) {
      const dateConversion = convertDateFormat(extractedData.tanggal_pelaksanaan);
      (extractedData as any).start_date = dateConversion.start_date;
      (extractedData as any).end_date = dateConversion.end_date;
    } else {
      (extractedData as any).start_date = "";
      (extractedData as any).end_date = "";
    }

    return extractedData;
  } catch (error) {
    console.error('Error in LLM analysis:', error);
    return null;
  }
}

// Fungsi membuat output final
function createFinalOutput(extractedData: SPTData | null): ProcessedData | null {
  if (!extractedData) return null;

  const finalOutput: ProcessedData = {
    user: extractedData.personil || [],
    report: {
      spt_number: extractedData.nomor_surat || '',
      destination: extractedData.tujuan_kegiatan || '',
      place_of_execution: extractedData.tempat_pelaksanaan || '',
      start_date: (extractedData as any).start_date || '',
      end_date: (extractedData as any).end_date || ''
    }
  };

  return finalOutput;
}

// Fungsi utama untuk memproses PDF
export async function processSPTPDF(pdfText: string): Promise<ProcessedData | { error: string }> {
  try {
    if (!pdfText || !pdfText.trim()) {
      return { error: 'PDF tidak mengandung teks yang bisa dibaca' };
    }

    // Clean text
    const cleanedText = cleanExtractedText(pdfText);

    if (!cleanedText || !cleanedText.trim()) {
      return { error: 'Tidak ada teks yang valid setelah pembersihan' };
    }

    // Validasi
    const validation = preValidateSptText(cleanedText);
    if (!validation.isValid) {
      return { error: validation.message };
    }

    // Analisis dengan LLM
    const extractedData = await analyzeTextWithLLM(cleanedText);

    if (!extractedData) {
      return { error: 'Gagal menganalisis dokumen dengan LLM' };
    }

    // Validasi akhir nomor surat
    const finalNomorSurat = extractedData.nomor_surat || '';
    if (!finalNomorSurat.toUpperCase().includes('BALMON.33')) {
      return { error: 'Nomor surat tidak mengandung Balmon.33' };
    }

    // Buat output final
    const finalOutput = createFinalOutput(extractedData);

    if (!finalOutput) {
      return { error: 'Gagal membuat output final' };
    }

    return finalOutput;
  } catch (error) {
    console.error('Error processing SPT PDF:', error);
    return { error: 'Terjadi kesalahan saat memproses PDF' };
  }
}

// Fungsi untuk extract text dari PDF (gunakan library seperti pdf-parse)
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  // Implementasi extract text dari PDF
  // Anda bisa menggunakan library seperti pdf-parse, pdf.js, dll.
  // Contoh dengan pdf-parse:
  try {
    // const pdf = require('pdf-parse');
    // const data = await pdf(pdfBuffer);
    // return data.text;
    
    // Untuk sekarang, return empty string sebagai placeholder
    return '';
  } catch (error) {
    throw new Error('Gagal membaca teks dari PDF');
  }
}