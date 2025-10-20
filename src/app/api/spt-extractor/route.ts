// import { NextRequest, NextResponse } from 'next/server';
// import { handleFileUpload } from '@/lib/uploads'; // Fungsi utilitas Anda untuk menangani file
// import { errorResponse } from "@/app/utils/response"; // Fungsi utilitas Anda
// import { analyzePDFWithLLM } from '@/service/supabase/LLMService';

// // Nonaktifkan body parser bawaan Next.js untuk file upload
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };


// export async function POST(request: NextRequest) {
//   try {
//     const formData = await request.formData();
//     // Asumsikan nama field di frontend adalah 'spt_file'
//     const docs = formData.get("spt_file") as File | null; 

//     if (!docs) {
//       return errorResponse(new Error("File SPT diperlukan."));
//     }
    
    
//     // 1. Simpan file ke direktori sementara di server
//     // Catatan: handleFileUpload harus dimodifikasi untuk mengembalikan PATH LOKAL (bukan URL storage)
//     const tempFilePath = await handleFileUpload(docs, { storage: 'temp' }); 

//     // 2. Panggil Logic LLM
//     const extractedData = await analyzePDFWithLLM(tempFilePath); 

//     // 3. Kembalikan data JSON yang terstruktur ke frontend
//     return NextResponse.json(extractedData); 

//   } catch (error: any) {
//     // Tangani error, termasuk InvariantError dari validasi LLM
//     return errorResponse(error);
//   }
// }