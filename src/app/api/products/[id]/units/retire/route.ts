import { prisma } from "@/lib/prismaClient";
import { deleteUnit } from "@/service/supabase/ProductsService";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: product_id } = await params;
    const body = await request.json();
    const { unit_id } = body;

    if (!unit_id) {
      return NextResponse.json(
        { error: "unit_id diperlukan" },
        { status: 400 }
      );
    }

    // Verifikasi bahwa unit_id belong to product_id
    const unit = await prisma.productUnit.findFirst({
      where: {
        unit_id,
        product_id,
      },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "Unit tidak ditemukan pada product ini" },
        { status: 404 }
      );
    }

    const deletedUnit = await deleteUnit(unit_id);

    return NextResponse.json({
      success: true,
      message: "Unit berhasil dihapus permanen",
      data: deletedUnit,
    });
  } catch (error: any) {
    console.error("Delete unit error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghapus unit" },
      { status: 400 }
    );
  }
}
