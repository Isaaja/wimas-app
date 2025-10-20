// import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
// import fs from "fs";
// // Asumsi InvariantError sudah didefinisikan di proyek Anda
// import InvariantError from "@/exceptions/InvariantError"; 
// import * as PdfParseModule from "pdf-parse";
// const PdfParse = (PdfParseModule as any)?.default ?? PdfParseModule;

// const pdf = PdfParse;


// // Tipe data untuk output JSON yang diharapkan
// interface SptData {
//     nomor_surat: string;
//     tanggal_pelaksanaan: string;
//     tempat_pelaksanaan: string;
//     tujuan_kegiatan: string;
//     personil: string[];
// }

// // Inisialisasi Klien Gemini
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// if (!GEMINI_API_KEY) {
//     throw new Error("GEMINI_API_KEY is not set in environment variables.");
// }
// const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });


// // ----------------------------------------------------
// // A. Fungsi Pre-Validasi (Wajib Balmon.33)
// // ----------------------------------------------------
// function preValidateSptText(text: string): void {
//     const textUpper = text.toUpperCase();

//     if (!textUpper.includes("SURAT TUGAS")) {
//         throw new InvariantError("Validasi Awal Gagal: Dokumen bukan Surat Tugas.");
//     }
    
//     // Pola Regex ketat: Mencari 'NOMOR' diikuti teks, lalu 'BALMON.33'
//     // Flag 's' digunakan setelah perbaikan tsconfig.json
//     const balmonPattern = /NOMOR.*BALMON\.33/s; 

//     if (!balmonPattern.test(textUpper)) {
//         throw new InvariantError("Validasi Awal Gagal: Nomor Surat wajib mengandung 'Balmon.33'.");
//     }
// }


// // ----------------------------------------------------
// // B. Fungsi Utama Analisis LLM
// // ----------------------------------------------------
// export async function analyzePDFWithLLM(tempFilePath: string): Promise<SptData> {
    
//     // Variabel untuk menyimpan path file sementara untuk dihapus di block finally
//     const finalTempFilePath = tempFilePath; 
//     let extractedText = "";

//     try {
//         // --- TAHAP 1: Ekstraksi Teks dari PDF ---
//         const dataBuffer = fs.readFileSync(finalTempFilePath);
//         const data = await pdf(dataBuffer);
//         extractedText = data.text;
        
//         // --- TAHAP 2: Pre-Validasi Cepat (Menghemat biaya API) ---
//         preValidateSptText(extractedText); 

//         // --- TAHAP 3: Pemanggilan LLM ---
//         const systemInstruction = (
//             "Anda adalah parser data yang sangat akurat. Tugas Anda adalah mengekstrak informasi yang diminta dari teks Surat Tugas (SPT) " +
//             "dan mengembalikannya dalam format JSON. JIKA SEBUAH DATA TIDAK DITEMUKAN, isi nilainya dengan string kosong (\" \"). " +
//             "JANGAN sertakan teks atau penjelasan lain di luar blok JSON."
//         );
        
//         const userPrompt = `
//           Ekstrak informasi berikut dari teks Surat Tugas di bawah:
//           1. Nomor Surat (Nomor SPT)
//           2. Tanggal Pelaksanaan (Format: DD MMMM YYYY s.d DD MMMM YYYY)
//           3. Tempat Pelaksanaan
//           4. Tujuan/Kegiatan
//           5. Daftar Nama Personil yang bertugas (kembalikan sebagai array string. Jika tidak ada, kembalikan array kosong: []).
          
//           Output harus dalam format JSON dengan kunci (key) berikut. PASTIKAN SEMUA KUNCI ADA:
//           {
//             "nomor_surat": "...",
//             "tanggal_pelaksanaan": "...",
//             "tempat_pelaksanaan": "...",
//             "tujuan_kegiatan": "...",
//             "personil": ["Nama 1", "Nama 2", ...]
//           }
          
//           Berikut teks Surat Tugas untuk dianalisis:
//           ---
//           ${extractedText}
//           ---
//         `;

//         const response: GenerateContentResponse = await ai.models.generateContent({
//             model: 'gemini-2.5-flash',
//             contents: userPrompt,
//             config: { systemInstruction: systemInstruction, responseMimeType: "application/json" }
//         });
        
//         // Perbaikan Error TS(18048): Cek apakah response.text ada
//         if (!response.text) {
//              throw new Error("API Gemini tidak mengembalikan teks. Respons mungkin kosong.");
//         }
        
//         const jsonString = response.text.trim().replace(/^```json|```$/g, '').trim();
//         const extractedData: SptData = JSON.parse(jsonString);


//         // --- TAHAP 4: Validasi Akhir Nilai LLM (Wajib Balmon.33) ---
//         if (extractedData.nomor_surat.toUpperCase().indexOf("BALMON.33") === -1) {
//             throw new InvariantError("Validasi Akhir Gagal: Nomor Surat hasil LLM tidak mengandung 'Balmon.33' secara utuh.");
//         }

//         // --- TAHAP 5: Pembersihan Final (Mengganti nilai kosong dengan "" agar bersih) ---
//         const finalData: SptData = {
//             nomor_surat: extractedData.nomor_surat.trim() || "",
//             tanggal_pelaksanaan: extractedData.tanggal_pelaksanaan.trim() || "",
//             tempat_pelaksanaan: extractedData.tempat_pelaksanaan.trim() || "",
//             tujuan_kegiatan: extractedData.tujuan_kegiatan.trim() || "",
//             personil: extractedData.personil || [],
//         };
        
//         return finalData;

//     } catch (error) {
//         // Jika error, pastikan error tersebut adalah InvariantError atau wrap sebagai InvariantError.
//         if (error instanceof InvariantError) {
//              throw error;
//         }
//         throw new InvariantError(`Gagal memproses LLM/PDF: ${(error as Error).message}`);

//     } finally {
//         // Pastikan pembersihan file sementara dilakukan, terlepas dari sukses/gagal.
//         if (fs.existsSync(finalTempFilePath)) {
//              fs.unlinkSync(finalTempFilePath);
//         }
//     }
// }