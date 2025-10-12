import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
import AuthenticationError from "@/exceptions/AuthenticationsError";
import { getLoanById } from "@/service/supabase/LoanService";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = checkAuth();
    const { id } = await context.params;
    const result = await getLoanById(id);
    if (
      result.borrower_id !== (await user).user_id &&
      (await user).role !== "ADMIN" &&
      (await user).role !== "SUPERADMIN"
    ) {
      throw new AuthenticationError("Access Denied");
    }
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
