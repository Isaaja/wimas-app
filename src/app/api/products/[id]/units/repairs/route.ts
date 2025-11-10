import { prisma } from "@/lib/prismaClient";
import { updateUnitCondition } from "@/service/supabase/ProductsService";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: product_id } = await params;
    const body = await request.json();
    const { unit_id, condition, note } = body;

    if (!unit_id || !condition) {
      return NextResponse.json(
        { error: "unit_id dan condition diperlukan" },
        { status: 400 }
      );
    }

    if (condition !== "GOOD" && condition !== "DAMAGED") {
      return NextResponse.json(
        { error: "Condition harus GOOD atau DAMAGED" },
        { status: 400 }
      );
    }

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

    const updatedUnit = await updateUnitCondition(unit_id, condition, note);

    return NextResponse.json({
      success: true,
      message: `Unit berhasil diperbaiki dan status menjadi AVAILABLE`,
      data: updatedUnit,
    });
  } catch (error: any) {
    console.error("Repair unit error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbaiki unit" },
      { status: 400 }
    );
  }
}
