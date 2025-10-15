import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY as string);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  message: string;
}

interface SendEmailResult {
  success: boolean;
  data?: unknown;
  error?: unknown;
}

/**
 * Mengirim email menggunakan Resend API
 * @param options - berisi to, subject, message
 * @returns hasil pengiriman email
 */
export async function sendRequestEmail({
  to,
  subject,
  message,
}: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const data = await resend.emails.send({
      from: "isaiantmaulana@resend.dev",
      to,
      subject,
      html: `<p>${message}</p>`,
    });

    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
