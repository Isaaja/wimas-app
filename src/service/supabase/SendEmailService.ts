import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY as string);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  status: string;
  borrowers: Borrower[];
  items: LoanItem[];
}

interface LoanItem {
  product_name: string;
  quantity: number;
  category?: Category;
}

interface Category {
  category_id: string;
  category_name: string;
}

interface SendEmailResult {
  success: boolean;
  data?: unknown;
  error?: unknown;
}

interface Borrower {
  name: string;
  role: string;
}

/**
 * Mengirim email permintaan persetujuan peminjaman perangkat ke admin.
 * Template sudah dibuat otomatis.
 */
export async function sendEmail({
  to,
  subject,
  borrowers,
  items,
  status,
}: SendEmailOptions): Promise<SendEmailResult> {
  try {
    // Daftar peminjam
    const borrowerList = borrowers
      .map(
        (b) =>
          `<li><strong>${b.name}</strong> <span style="color:#777;">(${b.role})</span></li>`
      )
      .join("");

    // Daftar barang
    const itemList = items
      .map((item) => {
        const categoryStr = item.category?.category_name ?? "-";

        return `
          <tr>
            <td style="padding: 6px 10px; border: 1px solid #ddd;">${item.product_name}</td>
            <td style="padding: 6px 10px; border: 1px solid #ddd; text-align:center;">${item.quantity}</td>
            <td style="padding: 6px 10px; border: 1px solid #ddd;">${categoryStr}</td>
          </tr>
        `;
      })
      .join("");

    const htmlTemplate = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Dear Admin,</p>

        <p>Berikut detail ${status} perangkat yang baru diterima:</p>

        <h3 style="margin-bottom: 8px;">👥 Peminjam:</h3>
        <ul style="margin-top: 0; padding-left: 20px;">
          ${borrowerList}
        </ul>

        <h3 style="margin-bottom: 8px;">📦 Barang yang dipinjam:</h3>
        <table style="border-collapse: collapse; width: 100%; margin-top: 8px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 8px 10px; border: 1px solid #ddd;">Nama Barang</th>
              <th style="padding: 8px 10px; border: 1px solid #ddd;">Jumlah</th>
              <th style="padding: 8px 10px; border: 1px solid #ddd;">Kategori</th>
            </tr>
          </thead>
          <tbody>
            ${itemList}
          </tbody>
        </table>

        <p style="margin-top: 16px;">
          Mohon untuk meninjau dan memberikan persetujuan melalui dashboard admin.
        </p>

        <p>Terima kasih atas perhatian dan kerjasamanya.</p>

        <p>Salam hormat,<br/>
        <strong>Sistem Peminjaman Perangkat</strong><br/>
        Isa Iant Maulana</p>

        <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;" />

        <p style="font-size: 12px; color: #666;">
          Email ini dikirim secara otomatis oleh sistem. Mohon tidak membalas email ini secara langsung.
        </p>
      </div>
    `;

    const data = await resend.emails.send({
      from: "isaiantmaulana@resend.dev",
      to,
      subject,
      html: htmlTemplate,
    });

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
