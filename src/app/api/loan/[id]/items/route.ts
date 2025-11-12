import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/app/utils/auth";
import InvariantError from "@/exceptions/InvariantError";
import { updateLoanById } from "@/service/supabase/LoanService";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await authenticate();
    if (error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: loanId } = await params;

    console.log("📝 Received loan_id:", loanId);

    if (!loanId) {
      return NextResponse.json(
        { error: "loan_id is required" },
        { status: 400 }
      );
    }

    const { items } = await request.json();

    console.log("📦 Updating items for loan:", loanId, items);

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items harus berupa array" },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Items tidak boleh kosong" },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.product_id || typeof item.quantity !== "number") {
        return NextResponse.json(
          { error: "Setiap item harus memiliki product_id dan quantity" },
          { status: 400 }
        );
      }
      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: "Quantity harus lebih dari 0" },
          { status: 400 }
        );
      }
    }

    const updatedLoan = await updateLoanById(loanId, { items });

    return NextResponse.json({
      success: true,
      message: "Item peminjaman berhasil diperbarui",
      data: updatedLoan,
    });
  } catch (error) {
    console.error("❌ Error updating loan items:", error);

    if (error instanceof InvariantError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
