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
export async function POST(req: Request) {
  try {
    const user = await checkAuth("BORROWER");
    const userId = user.user_id;
    const formData = await req.formData();
    const userRaw = formData.get("user") as string;
    const itemsRaw = formData.get("items") as string;
    const image = formData.get("image") as File | null;

    const userInvited = JSON.parse(userRaw);
    const items = JSON.parse(itemsRaw);

    const spt_letter = image ? await handleFileUpload(image) : null;

    const loanCheck = await checkUserLoan(userId);
    if (!loanCheck.canBorrow) {
      throw new Error(`Tidak bisa membuat pinjaman baru. ${loanCheck.reason}`);
    }

    LoanValidator.validateLoanPayload({
      user: userInvited,
      items,
      image: image
        ? {
            originalname: image.name,
            mimetype: image.type,
            size: image.size,
          }
        : null,
    });

    const loan = await createLoan({
      userId,
      invitedUsers: userInvited,
      items,
      spt_file: spt_letter,
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
