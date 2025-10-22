# Python SPT Extraction Service

Flask API service untuk mengekstrak data dari dokumen Surat Tugas (SPT) menggunakan Google Gemini AI.

## 🚀 Setup

### 1. Install Dependencies

```bash
cd python-script
pip install -r requirements.txt
```

### 2. Setup Environment Variables

Buat file `.env` di folder `python-script`:

```bash
# Windows PowerShell
"GEMINI_API_KEY=AIzaSyBNYLMMHHBXlw8t4PwOrqJFD5JaKhabbTA" | Out-File -FilePath .env -Encoding utf8

# Linux/Mac
cp env.template .env
```

Atau buat secara manual file `.env` dengan isi:

```
GEMINI_API_KEY=AIzaSyBNYLMMHHBXlw8t4PwOrqJFD5JaKhabbTA
```

### 3. Jalankan Server

```bash
python app/main.py
```

Server akan berjalan di:

- Local: `http://127.0.0.1:5000`
- Network: `http://[YOUR_IP]:5000`

## 📡 API Endpoints

### GET `/`

Health check endpoint

**Response:**

```json
{
  "message": "SPT Processing API is running"
}
```

### POST `/process-pdf`

Upload dan proses dokumen PDF SPT

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `pdf`: File PDF (max 5MB)

**Success Response (200):**

```json
{
  "report": {
    "spt_number": "366/Balmon.33/KP.01.06/07/2025",
    "destination": "Inspeksi Dalam Rangka Validasi Data Izin Stasiun Radio...",
    "place_of_execution": "Kota Semarang",
    "start_date": "2025-07-28",
    "end_date": "2025-08-01"
  },
  "user": [
    "Kuswahyudi, S.Kom., M.M.",
    "Purwanto, S.E.",
    "Agung Suryo Wibowo, S.Kom., M.T.",
    ...
  ]
}
```

**Error Response (400):**

```json
{
  "error": "Invalid SPT Document"
}
```

## 🔧 Struktur Folder

```
python-script/
├── app/
│   ├── main.py            # Main Flask application
│   └── python_service.py  # Alternative service file
├── .env                   # Environment variables (create this)
├── env.template           # Template for .env
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## 🛠️ Development

### Testing dengan curl:

```bash
curl -X POST http://localhost:5000/process-pdf \
  -F "pdf=@path/to/your/spt.pdf"
```

### Testing dengan Postman:

1. Method: POST
2. URL: `http://localhost:5000/process-pdf`
3. Body: form-data
4. Key: `pdf` (Type: File)
5. Value: Upload your PDF file

## 📝 Notes

- Server berjalan dalam debug mode untuk development
- CORS sudah dikonfigurasi untuk menerima request dari frontend
- Maximum file size: 5MB
- Hanya menerima file PDF
- Nomor SPT harus mengandung "BALMON.33"

## 🔗 Integration dengan Next.js

Frontend akan memanggil API ini melalui:

- Direct call: `http://localhost:5000/process-pdf`
- Via Next.js API route: `/api/spt-extractor`

Environment variable untuk production:

```env
PYTHON_SERVICE_URL=http://your-python-service-url:5000
```
