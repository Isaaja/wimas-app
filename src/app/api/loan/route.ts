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
import { handleFileUpload } from "@/lib/uploads";
export async function POST(req: Request) {
  try {
    // 🔒 Cek role user
    const user = await checkAuth("BORROWER");
    const userId = user.user_id;
    const formData = await req.formData();
    const userRaw = formData.get("user") as string;
    const itemsRaw = formData.get("items") as string;
    const image = formData.get("image") as File | null;

    const userInvited = JSON.parse(userRaw);
    const items = JSON.parse(itemsRaw);

    const image_path = image ? await handleFileUpload(image) : null;

    const check = await checkUserLoan(userId);
    if (!check.canBorrow) {
      return NextResponse.json(
        { status: "fail", message: check.reason },
        { status: 403 }
      );
    }

    const loan = await createLoan({
      userId,
      image_path: image_path ?? "",
      user: userInvited,
      items,
    });

    return successResponse(loan, "Loan created successfully", 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function GET() {
  const result = await getLoanedProducts();
  if (result.length <= 0) {
    throw new NotFoundError("Loan Not Found");
  }
  return successResponse(result);
}
