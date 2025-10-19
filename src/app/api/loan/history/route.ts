import { successResponse, errorResponse } from "@/app/utils/response";
import { getHistoryLoan } from "@/service/supabase/LoanService";

export async function GET() {
  try {
    const loans = await getHistoryLoan();
    if (Array.isArray(loans)) {
      return successResponse({
        loans,
        total: loans.length,
      });
    } else {
      return loans;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
