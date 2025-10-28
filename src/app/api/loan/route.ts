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
import { sendEmail } from "@/service/supabase/SendEmailService";
import { getUsersByIds } from "@/service/supabase/UsersService";
import { getProductsWithQuantity } from "@/service/supabase/ProductsService";
import InvariantError from "@/exceptions/InvariantError";

export async function POST(req: Request) {
  try {
    const user = await checkAuth("BORROWER");
    const userId = user.user_id;

    const formData = await req.formData();

    const userRaw = formData.get("user") as string;
    const itemsRaw = formData.get("items") as string;
    const docs = formData.get("docs") as File | null;
    const reportRaw = formData.get("report") as string;

    const invitedUsers = userRaw ? JSON.parse(userRaw) : [];
    const items = itemsRaw ? JSON.parse(itemsRaw) : [];
    const report = reportRaw ? JSON.parse(reportRaw) : null;

    // ✅ Upload dokumen dan simpan URL ke dalam report
    const spt_file = docs ? await handleFileUpload(docs) : null;

    const loanCheck = await checkUserLoan(userId);
    if (!loanCheck.canBorrow) {
      throw new Error(`Tidak bisa membuat pinjaman baru. ${loanCheck.reason}`);
    }

    LoanValidator.validateLoanPayload({
      user: invitedUsers,
      items,
      docs: docs
        ? {
            originalname: docs.name,
            mimetype: docs.type,
            size: docs.size,
          }
        : null,
      report,
    });

    const owner = [{ user_id: user.user_id, name: user.name, role: "OWNER" }];
    const invited = await getUsersByIds(invitedUsers, "INVITED");

    const listProduct = await getProductsWithQuantity(items);

    const loan = await createLoan({
      userId,
      invitedUsers,
      items,
      report: {
        ...report,
        spt_file,
      },
    });

    const result = await sendEmail({
      to: "isaiantmaulana2004@gmail.com",
      subject: "[PERMINTAAN] Persetujuan Peminjaman Perangkat",
      borrowers: [...owner, ...invited],
      items: listProduct,
      status: "permintaan",
    });

    console.log(invited);

    if (!result) {
      throw new InvariantError("Pesan tidak masuk");
    }

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
