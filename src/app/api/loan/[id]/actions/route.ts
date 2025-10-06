import { NextResponse } from "next/server";
import { approveLoan } from "@/service/supabase/LoanService";
import { checkAuth } from "@/app/utils/auth";
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await checkAuth("ADMIN");
    const updatedLoan = await approveLoan(id);

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

// export async function DELETE(context: { params: Promise<{ id: string }> }) {
//   try {
//     const { id } = await context.params;

//   } catch (error) {}
// }
