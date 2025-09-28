// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { getProductById } from "@/service/supabase/ProductsService";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const item = await getProductById(params.id);

    return NextResponse.json({
      status: "success",
      data: { item },
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      { status: "fail", message: error.message || "Error retrieving item" },
      { status: statusCode }
    );
  }
}
