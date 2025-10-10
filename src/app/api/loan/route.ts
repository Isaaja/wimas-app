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
import LoanValidator from "@/validator/loans";
import InvariantError from "@/exceptions/InvariantError";
export async function POST(req: Request) {
  try {
    // 🔒 Cek role user
    await checkAuth("BORROWER");

    const formData = await req.formData();
    const userId = formData.get("userId") as string;
    const userRaw = formData.get("user") as string;
    const itemsRaw = formData.get("items") as string;
    const image = formData.get("image") as File | null;

    const user = JSON.parse(userRaw);
    const items = JSON.parse(itemsRaw);

    const image_path = image ? await handleFileUpload(image) : null;

    // const payload = { userId, image_path, user, items };

    // LoanValidator.validateLoanPayload(payload);
    // if (!LoanValidator) {
    //   throw new InvariantError("Payload anda salah");
    // }

    const check = await checkUserLoan(userId);
    if (!check.canBorrow) {
      return NextResponse.json(
        { status: "fail", message: check.reason },
        { status: 403 }
      );
    }

    // 💾 Buat loan baru
    const loan = await createLoan({
      userId,
      image_path: image_path ?? "",
      user,
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
  return NextResponse.json({
    status: "success",
    data: {
      result,
    },
  });
}
