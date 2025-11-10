import { successResponse, errorResponse } from "@/app/utils/response";
import { authenticate } from "@/app/utils/auth";
import { checkUserLoan } from "@/service/supabase/LoanService";

export async function GET() {
  try {
    const { user, error } = await authenticate();
    if (error) return error;

    const result = await checkUserLoan(user!.user_id);

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}
