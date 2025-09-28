import { prisma } from "@/lib/prismaClient";
import { nanoid } from "nanoid";

export async function createLoan(
  userId: string,
  items: { product_id: string; quantity: number }[]
) {
  const loanId = `loan-${nanoid(16)}`;
  return prisma.loan.create({
    data: {
      loan_id: loanId,
      user_id: userId,
      status: "REQUESTED",
      details: {
        create: items.map((item) => ({
          loan_detail_id: `ld-${nanoid(16)}`,
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      },
    },
    include: { details: true },
  });
}

export async function approveLoan(loanId: string) {
  return prisma.$transaction(
    async (tx) => {
      // 1. Ambil loan + details
      const loan = await tx.loan.findUnique({
        where: { loan_id: loanId },
        include: { details: true },
      });

      if (!loan) throw new Error("Loan not found");
      if (loan.status !== "REQUESTED")
        throw new Error("Loan is not in REQUESTED status");

      // 2. Ambil semua product terkait sekaligus
      const products = await tx.product.findMany({
        where: {
          product_id: { in: loan.details.map((d) => d.product_id) },
        },
      });

      // Validasi stok
      for (const detail of loan.details) {
        const product = products.find(
          (p) => p.product_id === detail.product_id
        );
        if (!product) throw new Error(`Product ${detail.product_id} not found`);
        if (product.product_avaible < detail.quantity) {
          throw new Error(
            `Insufficient stock for product ${product.product_name}`
          );
        }
      }

      // 3. Kurangi stok product secara paralel
      await Promise.all(
        loan.details.map((detail) =>
          tx.product.update({
            where: { product_id: detail.product_id },
            data: {
              product_avaible: { decrement: detail.quantity },
            },
          })
        )
      );

      // 4. Update loan status
      return tx.loan.update({
        where: { loan_id: loanId },
        data: { status: "APPROVED" },
        include: { details: true },
      });
    },
    {
      timeout: 15000, // transaksi boleh jalan max 15 detik
      maxWait: 5000, // antre max 5 detik sebelum gagal
    }
  );
}
