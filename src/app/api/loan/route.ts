// app/api/loans/route.ts
import { NextResponse } from "next/server";
import { createLoan } from "@/service/supabase/LoanService";
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
