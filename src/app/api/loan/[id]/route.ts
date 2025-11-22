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
    checkAuth("ADMIN");
    const { id } = await context.params;
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return errorResponse("Items harus berupa array");
    }

    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        return errorResponse(
          "Setiap item harus memiliki product_id dan quantity"
        );
      }
      if (item.quantity <= 0) {
        return errorResponse("Quantity harus lebih dari 0");
      }
    }

    const updateLoan = await updateLoanById(id, { items });

    return successResponse(updateLoan, "Perangkat berhasil diupdate", 200);
  } catch (error: any) {
    return errorResponse(error);
  }
}
