import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
import { rejectLoan } from "@/service/supabase/LoanService";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await checkAuth("ADMIN");
    const updatedLoan = await rejectLoan(id);
    return successResponse(updatedLoan);
  } catch (error: any) {
    return errorResponse(error);
  }
}
