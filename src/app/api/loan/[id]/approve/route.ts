import { NextRequest, NextResponse } from "next/server";
import { authenticate, checkAuth } from "@/app/utils/auth";
import InvariantError from "@/exceptions/InvariantError";
import NotFoundError from "@/exceptions/NotFoundError";
import { approveLoanWithUnits } from "@/service/supabase/LoanService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await authenticate();
    if (error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: loanId } = await params;

    console.log("✅ Approving loan:", loanId);

    if (!loanId) {
      return NextResponse.json(
        { error: "loan_id is required" },
        { status: 400 }
      );
    }

    const { unitAssignments } = await request.json();

    console.log("📦 Unit assignments:", unitAssignments);

    if (!unitAssignments || !Array.isArray(unitAssignments)) {
      return NextResponse.json(
        { error: "unitAssignments harus berupa array" },
        { status: 400 }
      );
    }

    if (unitAssignments.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada unit yang dipilih" },
        { status: 400 }
      );
    }

    for (const assignment of unitAssignments) {
      if (!assignment.product_id || !Array.isArray(assignment.unit_ids)) {
        return NextResponse.json(
          {
            error:
              "Setiap assignment harus memiliki product_id dan unit_ids (array)",
          },
          { status: 400 }
        );
      }

      if (assignment.unit_ids.length === 0) {
        return NextResponse.json(
          {
            error: `Product ${assignment.product_id} harus memiliki minimal 1 unit`,
          },
          { status: 400 }
        );
      }
    }

    const approvedLoan = await approveLoanWithUnits(loanId, unitAssignments);

    return NextResponse.json({
      success: true,
      message: "Peminjaman berhasil disetujui",
      data: approvedLoan,
    });
  } catch (error) {
    console.error("❌ Error approving loan:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

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
