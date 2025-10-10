import { approveLoan } from "@/service/supabase/LoanService";
import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await checkAuth("ADMIN");
    const updatedLoan = await approveLoan(id);
    return successResponse(updatedLoan);
  } catch (error: any) {
    return errorResponse(error);
  }
}
