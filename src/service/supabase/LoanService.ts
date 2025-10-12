import { formatLoanResponse } from "@/app/utils/formatLoanResponse";
import InvariantError from "@/exceptions/InvariantError";
import NotFoundError from "@/exceptions/NotFoundError";
import { prisma } from "@/lib/prismaClient";
import { nanoid } from "nanoid";

export async function createLoan({
  userId,
  invitedUsers = [],
  items,
  spt_file,
}: any) {
  const loanId = `loan-${nanoid(16)}`;

  const loan = await prisma.$transaction(
    async (tx) => {
      const loan = await tx.loan.create({
        data: {
          loan_id: loanId,
          borrower_id: userId,
          spt_file,
          status: "REQUESTED",
          items: {
            create: items.map((item: any) => ({
              loan_item_id: `li-${nanoid(16)}`,
              product_id: item.product_id,
              quantity: item.quantity,
            })),
          },
          participants: {
            create: [
              {
                id: `lp-${nanoid(16)}`,
                user_id: userId,
                role: "OWNER",
              },
              ...invitedUsers.map((uid: any) => ({
                id: `lp-${nanoid(16)}`,
                user_id: uid,
                role: "INVITED",
              })),
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: { select: { user_id: true, username: true } },
            },
          },
          items: {
            include: {
              product: { select: { product_id: true, product_name: true } },
            },
          },
        },
      });

      return {
        data: {
          loan,
        },
      };
    },
    {
      timeout: 15000,
      maxWait: 5000,
    }
  );

  return loan;
}

export async function approveLoan(loanId: string) {
  return prisma.$transaction(
    async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { loan_id: loanId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!loan) throw new Error("Loan not found");

      const allProductIds = loan.items.map((item: any) => item.product_id);

      const products = await tx.product.findMany({
        where: { product_id: { in: allProductIds } },
      });

      for (const item of loan.items as Array<{
        product_id: string;
        quantity: number;
      }>) {
        const product = products.find((p) => p.product_id === item.product_id);

        if (!product) {
          throw new NotFoundError(`Product ${item.product_id} not found`);
        }

        if (product.product_avaible < item.quantity) {
          throw new InvariantError(
            `Insufficient stock for product ${product.product_name}`
          );
        }
      }

      await Promise.all(
        (loan.items as Array<{ product_id: string; quantity: number }>).map(
          (item) =>
            tx.product.update({
              where: { product_id: item.product_id },
              data: {
                product_avaible: { decrement: item.quantity },
              },
            })
        )
      );

      const updatedLoan = await tx.loan.update({
        where: { loan_id: loanId },
        data: { status: "APPROVED" },
      });

      return updatedLoan;
    },
    {
      timeout: 15000, // maksimal waktu transaksi 15 detik
      maxWait: 5000, // maksimal tunggu antrian 5 detik
    }
  );
}

export async function checkUserLoan(userId: string) {
  const latestLoan = await prisma.loan.findFirst({
    where: {
      OR: [
        { borrower_id: userId },
        {
          participants: {
            some: {
              user_id: userId,
              role: { in: ["OWNER", "INVITED"] },
            },
          },
        },
      ],
      status: { in: ["REQUESTED", "APPROVED"] },
    },
    orderBy: { created_at: "desc" },
  });

  if (!latestLoan) {
    return { canBorrow: true, reason: "Belum ada pinjaman aktif" };
  }

  return {
    canBorrow: false,
    reason: `Sedang ada pinjaman dengan status: ${latestLoan.status}`,
  };
}

export async function getLoanedProducts() {
  const loans = await prisma.loan.findMany({
    include: {
      borrower: { select: { user_id: true, name: true, username: true } },
      participants: {
        include: {
          user: { select: { user_id: true, name: true, username: true } },
        },
      },
      items: {
        include: {
          product: { select: { product_id: true, product_name: true } },
        },
      },
    },
  });

  return loans.map(formatLoanResponse);
}

export async function rejectLoan(loanId: string) {
  return prisma.$transaction(
    async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { loan_id: loanId },
      });

      if (!loan) throw new NotFoundError("Loan not found");

      if (loan.status === "REJECTED") {
        throw new Error("Loan already rejected");
      }
      if (loan.status === "APPROVED") {
        throw new Error("Loan already approved");
      }

      return tx.loan.update({
        where: { loan_id: loanId },
        data: { status: "REJECTED" },
      });
    },
    {
      timeout: 15000,
      maxWait: 5000,
    }
  );
}
export async function getLoanById(loanId: string) {
  const loan = await prisma.loan.findUnique({
    where: { loan_id: loanId },
    include: {
      borrower: { select: { user_id: true, name: true, username: true } },
      participants: {
        include: {
          user: { select: { user_id: true, name: true, username: true } },
        },
      },
      items: {
        include: {
          product: { select: { product_id: true, product_name: true } },
        },
      },
    },
  });

  if (!loan) {
    throw new Error("Loan not found");
  }

  return formatLoanResponse(loan);
}
