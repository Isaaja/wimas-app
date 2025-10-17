import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
import { returnLoan } from "@/service/supabase/LoanService";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    checkAuth("ADMIN");
    const { id } = await context.params;
    const result = await returnLoan(id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
