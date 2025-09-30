// app/api/loans/route.ts
import { NextResponse } from "next/server";
import {
  checkUserLoan,
  createLoan,
  getLoanedProducts,
} from "@/service/supabase/LoanService";
import NotFoundError from "@/exceptions/NotFoundError";
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, items } = body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { status: "fail", message: "Invalid request payload" },
        { status: 400 }
      );
    }

    const CheckUserLoan = await checkUserLoan(userId);
    if (!CheckUserLoan.canBorrow) {
      return NextResponse.json(
        { status: "fail", message: CheckUserLoan.reason },
        { status: 403 }
      );
    }
    const loan = await createLoan(userId, items);
    return NextResponse.json(
      {
        status: "success",
        data: loan,
      },

      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating loan:", error);
    return NextResponse.json(
      { status: "fail", message: error.message || "Error creating loan" },
      { status: 500 }
    );
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
