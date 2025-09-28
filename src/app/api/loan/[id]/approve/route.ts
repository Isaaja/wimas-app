import { NextResponse } from "next/server";
import { approveLoan } from "@/service/supabase/LoanService";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = await params.id;
    const updatedLoan = await approveLoan(loanId);

    return NextResponse.json(
      { status: "success", data: updatedLoan },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error approving loan:", error);
    return NextResponse.json(
      { status: "fail", message: error.message || "Error approving loan" },
      { status: 500 }
    );
  }
}
