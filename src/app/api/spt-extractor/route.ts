// app/api/spt-extractor/[loan_id]/route.ts

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  extractTextFromPDF,
  processSPTPDF,
} from "@/service/supabase/LLMService";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File PDF tidak ditemukan" },
        { status: 400 }
      );
    }

    // ===== 1️⃣ Simpan file ke folder lokal =====
    const uploadDir = path.join(process.cwd(), "public", "uploads", "spt");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `${"loan_id"}_${timestamp}_${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/uploads/spt/${fileName}`;

    // ===== 2️⃣ Ekstrak teks dari PDF =====
    console.log("🔍 Memulai ekstraksi PDF...");
    const pdfText = await extractTextFromPDF(buffer);
    console.log("📄 PDF Text Extracted (preview):", pdfText.slice(0, 300));
    console.log("📊 Total text length:", pdfText.length);

    // ===== 3️⃣ Proses teks hasil ekstraksi =====
    const result = await processSPTPDF(pdfText);
    if ("error" in result) {
      console.error("❌ Proses gagal:", result.error);
      return NextResponse.json(result, { status: 400 });
    }

    // ===== 4️⃣ Konversi tanggal ke Date object =====
    const start_date = new Date(result.report.start_date);
    const end_date = new Date(result.report.end_date);

    // ===== 5️⃣ Hanya tampilkan di console, tanpa create =====
    const reportId = `report-${nanoid(16)}`;
    const simulatedReport = {
      report_id: reportId,
      loan_id: "sembarang",
      spt_file: fileUrl,
      spt_number: result.report.spt_number,
      destination: result.report.destination,
      place_of_execution: result.report.place_of_execution,
      start_date,
      end_date,
      user: result.user,
    };

    console.log("✅ Hasil Analisis SPT:");
    console.log(JSON.stringify(simulatedReport, null, 2));

    // ===== 6️⃣ Kembalikan hasil ke frontend =====
    return NextResponse.json({
      success: true,
      message: "SPT berhasil diproses (simulasi, tanpa database)",
      data: simulatedReport,
    });
  } catch (error: any) {
    console.error("🚨 Upload gagal:", error);
    console.error("🚨 Error message:", error?.message);
    console.error("🚨 Error stack:", error?.stack);
    return NextResponse.json(
      {
        error: error.message || "Terjadi kesalahan saat memproses file",
        details: error?.stack,
      },
      { status: 500 }
    );
  }
}
