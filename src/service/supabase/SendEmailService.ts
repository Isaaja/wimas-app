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
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; background-color:#f9f9f9; padding:20px;">
  <div style="max-width:600px; margin:0 auto; background-color:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
    
    <div style="background-color:#1D4ED8; color:white; padding:16px; text-align:center;">
      <h2 style="margin:0; font-size:20px;">Detail ${status} Peminjaman Perangkat</h2>
    </div>

    <div style="padding:16px;">
      <p>Halo Admin,</p>
      <p>Berikut detail <strong>${status}</strong> perangkat yang baru diterima:</p>

      <h3 style="margin-top:20px; margin-bottom:8px; color:#1D4ED8;">👥 Peminjam</h3>
      <div style="background-color:#F3F4F6; padding:12px; border-radius:6px;">
        <ul style="margin:0; padding-left:20px;">
          ${borrowerList}
        </ul>
      </div>

      <h3 style="margin-top:20px; margin-bottom:8px; color:#1D4ED8;">📦 Barang yang Dipinjam</h3>
      <div style="overflow-x:auto;">
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="background-color: #E0E7FF; text-align:left;">
              <th style="padding: 10px; border: 1px solid #ddd;">Nama Barang</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align:center;">Jumlah</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Kategori</th>
            </tr>
          </thead>
          <tbody>
            ${itemList}
          </tbody>
        </table>
      </div>

      <p style="margin-top:16px;">
        Mohon untuk meninjau dan memberikan persetujuan melalui dashboard admin.
      </p>

      <p>Terima kasih atas perhatian dan kerjasamanya.</p>

      <p>Salam hormat,<br/>
      <strong>Sistem Peminjaman Perangkat</strong><br/>
      Isa Iant Maulana</p>
    </div>

    <div style="background-color:#F3F4F6; padding:12px; text-align:center; font-size:12px; color:#666;">
      Email ini dikirim secara otomatis oleh sistem. Mohon tidak membalas email ini secara langsung.
    </div>
    
  </div>
</div>
`;

    const data = await resend.emails.send({
      from: "no-reply@isaiantmaulana.my.id",
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
