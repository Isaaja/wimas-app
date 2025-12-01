import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
import InvariantError from "@/exceptions/InvariantError";
import { returnLoan, getLoanById } from "@/service/supabase/LoanService";
import { getProductsWithQuantity } from "@/service/supabase/ProductsService";
import { sendEmail } from "@/service/supabase/SendEmailService";
import { getUsersByIds } from "@/service/supabase/UsersService";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth("BORROWER");
    const { id } = await context.params;

    // Ambil data loan
    const loan = await getLoanById(id);
    if (!loan) throw new InvariantError("Loan tidak ditemukan");

    const owner = [{ user_id: user.user_id, name: user.name, role: "OWNER" }];
    const invitedUserIds = loan.invited_users.map(
      (u: { user_id: any }) => u.user_id
    );

    const invited = await getUsersByIds(invitedUserIds, "INVITED");

    // Ambil list produk dengan quantity
    const listProduct = await getProductsWithQuantity(loan.items);

    // Kirim email
    const email = await sendEmail({
      to: "isaiantmaulana2004@gmail.com",
      subject: "[PERMINTAAN] Pengembalian Barang",
      borrowers: [...owner, ...invited],
      items: listProduct,
      status: "Pengembalian",
    });

    if (!email) throw new InvariantError("Pesan tidak masuk");

    // Return loan
    const result = await returnLoan(id);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
