// app/api/loans/route.ts
import { NextResponse } from "next/server";
import {
  createLoan,
  getLoanedProducts,
  checkUserLoan,
} from "@/service/supabase/LoanService";
import NotFoundError from "@/exceptions/NotFoundError";
import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
export async function POST(req: Request) {
  try {
    // check Role Access
    await checkAuth("BORROWER");
    const body = await req.json();
    const { userId, items } = body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { status: "fail", message: "Invalid request payload" },
        { status: 400 }
      );
    }
    //check User Loan
    const CheckUserLoan = await checkUserLoan(userId);
    if (!CheckUserLoan.canBorrow) {
      return NextResponse.json(
        { status: "fail", message: CheckUserLoan.reason },
        { status: 403 }
      );
    }

    const loan = await createLoan(userId, items);
    return successResponse(loan, "", 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function GET() {
  const result = await getLoanedProducts();
  if (result.length <= 0) {
    throw new NotFoundError("Loan Not Found");
  }
  return NextResponse.json({
    status: "success",
    data: {
      result,
    },
  });
}
