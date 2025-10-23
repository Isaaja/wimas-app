import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
import { returnLoan } from "@/service/supabase/LoanService";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await checkAuth("BORROWER");
    const { id } = await context.params;
    const result = await returnLoan(id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
