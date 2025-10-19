import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
import AuthenticationError from "@/exceptions/AuthenticationsError";
import InvariantError from "@/exceptions/InvariantError";
import { getLoanById, updateLoanById } from "@/service/supabase/LoanService";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = checkAuth();
    const { id } = await context.params;
    const result = await getLoanById(id);
    console.log(result?.borrower.user_id);
    console.log((await user).user_id);
    if (
      result?.borrower.user_id !== (await user).user_id &&
      (await user).role !== "ADMIN"
    ) {
      throw new AuthenticationError("Access Denied");
    }
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    checkAuth("ADMIN");
    const { id } = await context.params;

    // Validate request body
    if (!body.items && !body.status) {
      throw new InvariantError(
        "At least one field (items or status) must be provided for updates."
      );
    }

    const updateLoan = await updateLoanById(id, body);
    if (!updateLoan) {
      throw new InvariantError("Failed to Update Loan");
    }
    return successResponse(updateLoan, "Loan berhasil diupdate", 200);
  } catch (error) {
    return errorResponse(error);
  }
}
