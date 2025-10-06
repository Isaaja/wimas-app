import NotFoundError from "@/exceptions/NotFoundError";
import { getCategory } from "@/service/supabase/CategoryService";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await getCategory();
    if (result.length <= 0) {
      throw new NotFoundError("Tidak ada kategori");
    }
    return NextResponse.json({
      status: "success",
      result,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      { status: "fail", message: error.message || "Error updating product" },
      { status: statusCode }
    );
  }
}
