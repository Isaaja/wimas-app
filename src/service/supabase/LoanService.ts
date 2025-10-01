import NotFoundError from "@/exceptions/NotFoundError";
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
    include: {
      details: true,
      user: {
        select: {
          user_id: true,
          username: true,
        },
      },
    },
  });
}

export async function approveLoan(loanId: string) {
  return prisma.$transaction(
    async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { loan_id: loanId },
        include: { details: true },
      });

      if (!loan) throw new NotFoundError("Loan not found");

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

export async function checkUserLoan(userId: string) {
  const latestLoan = await prisma.loan.findFirst({
    where: { user_id: userId },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });

  if (!latestLoan) {
    return { canBorrow: true, reason: "Belum ada pinjaman" };
  }
  if (latestLoan.status === "APPROVED" || latestLoan.status === "REQUESTED") {
    return {
      canBorrow: false,
      reason: `Status terakhir: ${latestLoan.status}`,
    };
  }
  return { canBorrow: true, reason: "Belum ada pinjaman" };
}

export async function getLoanedProducts() {
  const loanDetails = await prisma.loanDetail.findMany({
    select: {
      quantity: true,
      loan: {
        select: {
          loan_id: true,
          loan_date: true,
          return_date: true,
          status: true,
          user: {
            select: {
              user_id: true,
              name: true,
            },
          },
        },
      },
      product: {
        select: {
          product_name: true,
        },
      },
    },
  });

  const grouped = loanDetails.reduce((acc, item) => {
    const loanId = item.loan.loan_id;

    if (!acc[loanId]) {
      acc[loanId] = {
        loan_id: loanId,
        loan_date: item.loan.loan_date,
        return_date: item.loan.return_date,
        status: item.loan.status,
        user_id: item.loan.user.user_id,
        name: item.loan.user.name,
        products: [],
      };
    }

    acc[loanId].products.push({
      product_name: item.product.product_name,
      quantity: item.quantity,
    });

    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped);
}
