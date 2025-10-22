# 🔌 Integration Guide: Auto-fill SPT Data dari PDF

Dokumentasi integrasi fitur auto-fill data SPT dari dokumen PDF menggunakan Python service.

## 📋 Overview

Fitur ini memungkinkan user untuk:

1. Upload dokumen PDF SPT
2. Otomatis mengekstrak data menggunakan AI (Google Gemini)
3. Auto-fill form dengan data yang diekstrak
4. Auto-fill daftar anggota tim dari dokumen

## 🔄 Flow Diagram

```
User Upload PDF → Python Service (Gemini AI) → Extract Data → Auto-fill Form
                                                              ↓
                                              Auto-fill User List (Step 3)
```

## 🚀 Setup & Running

### 1. Python Service Setup

```bash
# Navigate to python-script folder
cd python-script

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Windows PowerShell:
"GEMINI_API_KEY=AIzaSyBNYLMMHHBXlw8t4PwOrqJFD5JaKhabbTA" | Out-File -FilePath .env -Encoding utf8

# Or manually create .env with:
# GEMINI_API_KEY=AIzaSyBNYLMMHHBXlw8t4PwOrqJFD5JaKhabbTA

# Run the service
python app/main.py
```

Python service akan berjalan di: `http://localhost:5000`

### 2. Frontend Setup

Pastikan Next.js development server berjalan:

```bash
npm run dev
# or
yarn dev
```

## 📡 API Integration

### Python Service Endpoint

**URL:** `http://localhost:5000/process-pdf`  
**Method:** `POST`  
**Content-Type:** `multipart/form-data`  
**Body:** `pdf` (File)

### Response Format

```typescript
{
  "report": {
    "spt_number": string,
    "destination": string,
    "place_of_execution": string,
    "start_date": string,      // Format: YYYY-MM-DD
    "end_date": string          // Format: YYYY-MM-DD
  },
  "user": string[]              // Array of user names
}
```

### Example Response

```json
{
  "report": {
    "spt_number": "366/Balmon.33/KP.01.06/07/2025",
    "destination": "Inspeksi Dalam Rangka Validasi Data Izin Stasiun Radio (ISR) Monitoring Nasional Microwave Link Tahun 2025",
    "place_of_execution": "Kota Semarang",
    "start_date": "2025-07-28",
    "end_date": "2025-08-01"
  },
  "user": [
    "Kuswahyudi, S.Kom., M.M.",
    "Purwanto, S.E.",
    "Agung Suryo Wibowo, S.Kom., M.T.",
    "Wahyu Minarti, S.T.",
    "Mahardi Sentika, S.T.",
    "Ratna Mumpuni, S.T., M.Eng.",
    "Tanhidhul Umam Fatkhi, S.T.",
    "Santi Pramesthi, S.T.",
    "Rully Prasetyo Baskoro, S.T.",
    "Edy Sulistio, A.Md.",
    "Irfan Widiyarto, S.T.",
    "Monicha Sari Hidayah, S.Kom.",
    "Avi Anindya Saksono, S.T.",
    "Alfido Indrawan, A.Md.T"
  ]
}
```

## 🎯 Frontend Components Modified

### 1. CartStep2.tsx

**Location:** `src/app/components/borowwer/CartStep2.tsx`

**New Features:**

- ✨ Auto-process PDF saat file diupload
- 🔄 Loading indicator saat processing
- ✅ Success notification dengan auto-fill
- ❌ Error handling
- 📝 Auto-fill semua field report data

**Key Functions:**

```typescript
const processPDF = async (file: File) => {
  // Calls Python service
  // Auto-fills reportData
  // Extracts user list for Step 3
};
```

### 2. CartSummary.tsx

**Location:** `src/app/components/borowwer/CartSummary.tsx`

**New Features:**

- 📋 State management untuk extracted users
- 🔗 Pass extracted users ke CartStep3

**New State:**

```typescript
const [extractedUserNames, setExtractedUserNames] = useState<string[]>([]);
```

### 3. CartStep3.tsx

**Location:** `src/app/components/borowwer/CartStep3.tsx`

**New Features:**

- 📊 Display extracted users dari PDF
- ⚡ Button "Pilih Semua" untuk auto-select users
- 🔍 Smart name matching untuk auto-select

**Key Functions:**

```typescript
const handleAutoSelectExtractedUsers = () => {
  // Match extracted names dengan database users
  // Auto-select matched users
};
```

### 4. API Route

**Location:** `src/app/api/spt-extractor/route.ts`

**Updated:**

- 🔧 Updated endpoint ke `/process-pdf`
- 🔧 Updated form key ke `pdf`
- ⚙️ Environment variable support

## 🎨 UI/UX Features

### Step 2 - Upload & Auto-fill

1. **Upload Indicator:**

   - File input disabled saat processing
   - Loading spinner dengan pesan

2. **Processing States:**

   ```
   🔄 Memproses dokumen SPT...
   ✨ Data berhasil diekstrak dan diisi otomatis!
   ❌ [Error message jika ada]
   ```

3. **Auto-filled Fields:**
   - Nomor SPT
   - Tujuan Kegiatan
   - Tempat Pelaksanaan
   - Tanggal Mulai
   - Tanggal Selesai

### Step 3 - Auto-select Users

1. **Extracted Users Box:**

   - Purple themed box
   - List semua nama yang diekstrak
   - Button "Pilih Semua" untuk auto-select

2. **Smart Matching:**
   - Case insensitive
   - Partial name matching
   - Only available borrowers

## 🧪 Testing

### Manual Testing Steps

1. **Start Python Service:**

   ```bash
   cd python-script
   python app/main.py
   ```

2. **Start Next.js:**

   ```bash
   npm run dev
   ```

3. **Test Flow:**
   - Navigate to peminjam page
   - Add items to cart
   - Open cart summary (Step 1)
   - Click "Lanjutkan" ke Step 2
   - Upload PDF SPT
   - Verify auto-fill works
   - Click "Lanjutkan" ke Step 3
   - Verify extracted users shown
   - Click "Pilih Semua"
   - Verify users auto-selected

### Test Cases

#### ✅ Success Case

- Upload valid SPT PDF
- All fields auto-filled correctly
- Users list extracted
- Auto-select works

#### ❌ Error Cases

- Upload non-PDF file → Error: "Hanya file PDF yang diperbolehkan"
- Upload invalid SPT → Error: "Invalid SPT Document"
- Python service down → Error: "Gagal memproses PDF"
- File > 5MB → Error: "File terlalu besar. Maksimal 5MB"

## 🔧 Configuration

### Environment Variables

**.env.local (Next.js):**

```env
PYTHON_SERVICE_URL=http://localhost:5000
```

**python-script/.env:**

```env
GEMINI_API_KEY=AIzaSyBNYLMMHHBXlw8t4PwOrqJFD5JaKhabbTA
```

### CORS Configuration

Python service sudah dikonfigurasi dengan CORS enabled untuk menerima request dari frontend.

## 🐛 Troubleshooting

### Python Service tidak berjalan

```bash
# Check if .env file exists
ls python-script/.env

# If not, create it
cd python-script
"GEMINI_API_KEY=AIzaSyBNYLMMHHBXlw8t4PwOrqJFD5JaKhabbTA" | Out-File -FilePath .env -Encoding utf8
```

### CORS Error

- Pastikan Python service running
- Check CORS configuration di `main.py`
- Verify URL di CartStep2.tsx (http://localhost:5000)

### Auto-fill tidak bekerja

- Check browser console untuk errors
- Verify Python service response format
- Check network tab untuk API call

### Users tidak auto-select

- Pastikan nama di PDF match dengan nama di database
- Check name matching logic di `handleAutoSelectExtractedUsers`
- Verify users available (tidak sedang pinjam)

## 📝 Notes

1. **Direct API Call:**

   - CartStep2 langsung call Python service (bypass Next.js API route untuk simplicity)
   - Bisa diubah ke Next.js API route jika perlu untuk production

2. **Name Matching:**

   - Current implementation: simple string includes
   - Bisa ditingkatkan dengan fuzzy matching atau Levenshtein distance

3. **Security:**
   - API Key di .env (jangan commit ke git)
   - Add rate limiting untuk production
   - Add authentication jika diperlukan

## 🚀 Production Deployment

### Python Service

```bash
# Use production WSGI server (e.g., Gunicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app.main:app
```

### Next.js

```bash
# Build
npm run build

# Set environment variable
PYTHON_SERVICE_URL=https://your-python-service-url.com
```

## 📚 Related Files

- `python-script/app/main.py` - Main Python service
- `src/app/components/borowwer/CartStep2.tsx` - Upload & auto-fill
- `src/app/components/borowwer/CartStep3.tsx` - User selection
- `src/app/components/borowwer/CartSummary.tsx` - Main cart modal
- `src/app/api/spt-extractor/route.ts` - Next.js API route (optional)

## ✅ Checklist

Setup:

- [ ] Python dependencies installed
- [ ] .env file created with API key
- [ ] Python service running on port 5000
- [ ] Next.js dev server running
- [ ] CORS enabled

Testing:

- [ ] Upload PDF works
- [ ] Auto-fill form works
- [ ] Extracted users shown
- [ ] Auto-select users works
- [ ] Error handling works

---

**Last Updated:** October 22, 2025  
**Version:** 1.0.0
