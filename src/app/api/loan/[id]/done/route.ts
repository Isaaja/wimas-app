import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
import { doneLoan } from "@/service/supabase/LoanService";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    checkAuth("ADMIN");
    const { id } = await context.params;

    const body = await req.json();
    const { unitConditions = {} } = body;

    const result = await doneLoan(id, unitConditions);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
