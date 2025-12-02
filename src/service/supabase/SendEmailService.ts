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
     // Status color mapping
     const statusColors: Record<string, string> = {
      'Permintaan': '#2563EB', // Blue-600
      'Persetujuan': '#059669', // Emerald-600
      'Peminjaman': '#7C3AED', // Violet-600
      'Pengembalian': '#DC2626', // Red-600
      'default': '#1D4ED8'
    };

    const statusColor = statusColors[status] || statusColors.default;

    // Daftar peminjam
    const borrowerList = borrowers
      .map(
        (b) =>
          `<li style="margin-bottom: 6px;"><strong style="color: #1E293B;">${b.name}</strong> <span style="color: #64748B; font-size: 14px;">(${b.role})</span></li>`
      )
      .join("");

    // Daftar barang
    const itemList = items
      .map((item) => {
        const categoryStr = item.category?.category_name ?? "-";

        return `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; color: #1E293B;">${item.product_name}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #1E293B; font-weight: 500;">${item.quantity}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; color: #475569;">${categoryStr}</td>
          </tr>
        `;
      })
      .join("");

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Notifikasi Peminjaman Perangkat</title>
    <style>
        @media (prefers-color-scheme: dark) {
            .email-container {
                background-color: #0F172A !important;
            }
            .email-card {
                background-color: #1E293B !important;
                color: #F1F5F9 !important;
            }
            .header {
                background-color: ${statusColor} !important;
            }
            .section-title {
                color: #38BDF8 !important;
            }
            .borrower-card {
                background-color: #334155 !important;
                border-color: #475569 !important;
            }
            .info-text {
                color: #CBD5E1 !important;
            }
            .table-header {
                background-color: #1E293B !important;
                border-bottom: 2px solid ${statusColor} !important;
            }
            .table-header th {
                color: #38BDF8 !important;
                border-color: #475569 !important;
            }
            table tbody tr {
                border-bottom: 1px solid #334155 !important;
            }
            table tbody td {
                color: #E2E8F0 !important;
                border-color: #475569 !important;
            }
            .footer {
                background-color: #0F172A !important;
                color: #94A3B8 !important;
                border-top: 1px solid #334155 !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color-scheme: light dark;">
    <div class="email-container" style="max-width: 100%; padding: 24px 16px; background-color: #F8FAFC;">
        <div class="email-card" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <!-- Header -->
            <div class="header" style="background-color: ${statusColor}; color: white; padding: 24px 32px; text-align: center;">
                <div style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">📋 Pemberitahuan ${status}</div>
                <div style="font-size: 16px; opacity: 0.9;">Sistem Peminjaman Perangkat</div>
            </div>

            <!-- Content -->
            <div style="padding: 32px;">
                <p class="info-text" style="color: #475569; margin: 0 0 20px 0;">Halo Admin,</p>
                
                <div style="background-color: #F0F9FF; border-left: 4px solid ${statusColor}; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #1E293B; margin: 0; font-weight: 500;">
                        Terdapat <strong style="color: ${statusColor};">${status.toLowerCase()}</strong> perangkat yang memerlukan tinjauan Anda.
                    </p>
                </div>

                <!-- Peminjam Section -->
                <h3 class="section-title" style="color: ${statusColor}; font-size: 18px; font-weight: 600; margin: 32px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #E2E8F0;">
                    👥 Informasi Peminjam
                </h3>
                <div class="borrower-card" style="background-color: #F8FAFC; padding: 20px; border-radius: 8px; border: 1px solid #E2E8F0;">
                    <ul style="margin: 0; padding-left: 20px;">
                        ${borrowerList}
                    </ul>
                </div>

                <!-- Barang Section -->
                <h3 class="section-title" style="color: ${statusColor}; font-size: 18px; font-weight: 600; margin: 32px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #E2E8F0;">
                    📦 Detail Perangkat
                </h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 500px;">
                        <thead>
                            <tr class="table-header" style="background-color: #F1F5F9;">
                                <th style="padding: 14px 16px; text-align: left; font-weight: 600; color: ${statusColor}; border-bottom: 2px solid ${statusColor};">Nama Barang</th>
                                <th style="padding: 14px 16px; text-align: center; font-weight: 600; color: ${statusColor}; border-bottom: 2px solid ${statusColor};">Jumlah</th>
                                <th style="padding: 14px 16px; text-align: left; font-weight: 600; color: ${statusColor}; border-bottom: 2px solid ${statusColor};">Kategori</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemList}
                        </tbody>
                    </table>
                </div>

                <!-- Call to Action -->
                <div style="margin-top: 32px; padding: 20px; background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); border-radius: 8px; border: 1px solid #BAE6FD;">
                    <p style="margin: 0 0 12px 0; color: #075985; font-weight: 500;">⏱️ Tindakan Diperlukan</p>
                    <p style="margin: 0; color: #0C4A6E;">
                        Mohon tinjau permintaan ini melalui dashboard admin dalam waktu 24 jam untuk melanjutkan proses.
                    </p>
                </div>

                <!-- Closing -->
                <p class="info-text" style="color: #475569; margin: 32px 0 0 0;">
                    Terima kasih atas perhatian dan kerjasamanya.
                </p>
                
                <p style="color: #1E293B; margin: 24px 0 0 0;">
                    Salam hormat,<br/>
                    <strong style="color: ${statusColor};">Sistem Peminjaman Perangkat</strong><br/>
                    <span style="color: #64748B; font-size: 14px;">Isa Iant Maulana</span>
                </p>
            </div>

            <!-- Footer -->
            <div class="footer" style="background-color: #F8FAFC; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0;">
                <p style="margin: 0 0 8px 0;">
                    Email ini dikirim secara otomatis oleh sistem. Mohon tidak membalas email ini secara langsung.
                </p>
                <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                    © ${new Date().getFullYear()} Sistem Peminjaman Perangkat. Semua hak dilindungi.
                </p>
            </div>
            
        </div>
    </div>
</body>
</html>
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
