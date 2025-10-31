import {
  createLoan,
  getLoanedProducts,
  checkUserLoan,
} from "@/service/supabase/LoanService";
import NotFoundError from "@/exceptions/NotFoundError";
import InvariantError from "@/exceptions/InvariantError";
import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
import LoanValidator from "@/validator/loans";
import { sendEmail } from "@/service/supabase/SendEmailService";
import { getUsersByIds } from "@/service/supabase/UsersService";
import { getProductsWithQuantity } from "@/service/supabase/ProductsService";
import { createClient } from "webdav";

export async function POST(req: Request) {
  try {
    // 🔐 Autentikasi borrower
    const user = await checkAuth("BORROWER");
    const userId = user.user_id;

    // Ambil semua field form
    const formData = await req.formData();
    const userRaw = formData.get("user") as string;
    const itemsRaw = formData.get("items") as string;
    const docs = formData.get("docs") as File | null;
    const reportRaw = formData.get("report") as string;

    const invitedUsers = userRaw ? JSON.parse(userRaw) : [];
    const items = itemsRaw ? JSON.parse(itemsRaw) : [];
    const report = reportRaw ? JSON.parse(reportRaw) : null;

    // Upload langsung ke NextCloud via WebDAV
    let remoteFileUrl: string | null = null;

    if (docs) {
      const arrayBuffer = await docs.arrayBuffer();
      const data = Buffer.from(arrayBuffer);

      const nextcloudBaseUrl = process.env.NEXT_CLOUD_BASE_URL;
      const nextcloudUser = process.env.NEXT_CLOUD_USER;
      const nextcloudPassword = process.env.NEXT_CLOUD_PASSWORD;

      console.log("alo : ", nextcloudUser);
      const client = createClient(
        `${nextcloudBaseUrl}/remote.php/dav/files/${nextcloudUser}`,
        { username: nextcloudUser, password: nextcloudPassword }
      );

      const folderPath = "/SPT";
      if (!(await client.exists(folderPath))) {
        await client.createDirectory(folderPath);
      }

      // Upload file ke NextCloud
      const timestamp = Date.now();
      const sanitizedFileName = docs.name.replace(/[<>:"|?*\\\/]/g, "_").trim();
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const remoteFilePath = `${folderPath}/${fileName}`;
      await client.putFileContents(remoteFilePath, data, { overwrite: true });

      const ocsUrl = `${nextcloudBaseUrl}/ocs/v2.php/apps/files_sharing/api/v1/shares`;
      const formBody = new URLSearchParams();
      formBody.append("path", remoteFilePath);
      formBody.append("shareType", "3");
      formBody.append("permissions", "1");

      const shareResp = await fetch(ocsUrl, {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${nextcloudUser}:${nextcloudPassword}`).toString(
              "base64"
            ),
          "OCS-APIRequest": "true",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      });

      const shareXml = await shareResp.text();
      const match = shareXml.match(/<url>(.*?)<\/url>/);
      remoteFileUrl = match ? match[1] : null;

      if (!remoteFileUrl) {
        remoteFileUrl = `${nextcloudBaseUrl}/apps/files/?dir=${encodeURIComponent(
          folderPath
        )}`;
      }

      console.log("✅ File uploaded and share URL:", remoteFileUrl);
    }

    // ✅ Cek apakah user masih boleh meminjam
    // const loanCheck = await checkUserLoan(userId);
    // if (!loanCheck.canBorrow) {
    //   throw new Error(`Tidak bisa membuat pinjaman baru. ${loanCheck.reason}`);
    // }

    // ✅ Validasi payload
    LoanValidator.validateLoanPayload({
      user: invitedUsers,
      items,
      docs: docs
        ? { originalname: docs.name, mimetype: docs.type, size: docs.size }
        : null,
      report,
    });

    const owner = [{ user_id: user.user_id, name: user.name, role: "OWNER" }];
    const invited = await getUsersByIds(invitedUsers, "INVITED");
    const listProduct = await getProductsWithQuantity(items);

    // ✅ Simpan data pinjaman ke database
    const loan = await createLoan({
      userId,
      invitedUsers,
      items,
      report: {
        ...report,
        spt_file: remoteFileUrl,
      },
    });

    // ✅ Kirim notifikasi email
    const result = await sendEmail({
      to: "isaiantmaulana2004@gmail.com",
      subject: "[PERMINTAAN] Persetujuan Peminjaman Perangkat",
      borrowers: [...owner, ...invited],
      items: listProduct,
      status: "permintaan",
    });

    if (!result) throw new InvariantError("Pesan tidak masuk");

    return successResponse(loan, "Loan created successfully", 201);
  } catch (error: any) {
    console.error("❌ Upload error:", error);
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
