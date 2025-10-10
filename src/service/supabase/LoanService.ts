import NotFoundError from "@/exceptions/NotFoundError";
import { prisma } from "@/lib/prismaClient";
import { nanoid } from "nanoid";

export async function createLoan(payload: {
  userId: string;
  image_path: string;
  user: string[];
  items: { product_id: string; quantity: number }[];
}) {
  const { userId, image_path, user, items } = payload;
  const loanId = `loan-${nanoid(16)}`;

  const loanDetails = user.flatMap((borrowerId) =>
    items.map((item) => ({
      loan_detail_id: `ld-${nanoid(16)}`,
      product_id: item.product_id,
      quantity: item.quantity,
      image_path,
      borrower_id: borrowerId,
    }))
  );

  return prisma.loan.create({
    data: {
      loan_id: loanId,
      user_id: userId,
      status: "REQUESTED",
      details: { create: loanDetails },
    },
    include: {
      details: true,
      user: { select: { user_id: true, username: true } },
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
      borrower: {
        select: {
          user_id: true,
          name: true,
          username: true,
        },
      },
      loan: {
        select: {
          loan_id: true,
          user_id: true,
          status: true,
          loan_date: true,
          return_date: true,
          user: {
            select: {
              name: true,
              username: true,
            },
          },
        },
      },
      product: {
        select: {
          product_id: true,
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
        user_id: item.loan.user_id,
        status: item.loan.status,
        loan_date: item.loan.loan_date,
        return_date: item.loan.return_date,
        invited_users: [],
        products: [],
      };
    }

    // ✅ Tambahkan produk
    acc[loanId].products.push({
      product_id: item.product.product_id,
      product_name: item.product.product_name,
      quantity: item.quantity,
    });

    // ✅ Null-safe borrower
    if (item.borrower) {
      acc[loanId].invited_users.push({
        borrower_id: item.borrower.user_id,
        borrower_name: item.borrower.name,
        borrower_username: item.borrower.username,
      });
    }

    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped);
}

export async function rejectLoan(loanId: string) {
  return prisma.$transaction(
    async (tx) => {
      // 1. Cek apakah loan ada
      const loan = await tx.loan.findUnique({
        where: { loan_id: loanId },
        include: { details: true },
      });

      if (!loan) throw new NotFoundError("Loan not found");

      // 2. Cek apakah status sudah bukan rejected/approved
      if (loan.status === "REJECTED") {
        throw new Error("Loan already rejected");
      }
      if (loan.status === "APPROVED") {
        throw new Error("Loan already approved");
      }

      // 3. Update status loan menjadi REJECTED
      return tx.loan.update({
        where: { loan_id: loanId },
        data: { status: "REJECTED" },
        include: { details: true },
      });
    },
    {
      timeout: 15000, // transaksi boleh jalan max 15 detik
      maxWait: 5000, // antre max 5 detik sebelum gagal
    }
  );
}

export async function getLoanbyId(loanId: string) {
  const loanDetails = await prisma.loanDetail.findMany({
    where: { loan_id: loanId },
    select: {
      quantity: true,
      borrower: {
        select: {
          user_id: true,
          name: true,
          username: true,
        },
      },
      loan: {
        select: {
          loan_id: true,
          user_id: true,
          status: true,
          loan_date: true,
          return_date: true,
        },
      },
      product: {
        select: {
          product_id: true,
          product_name: true,
        },
      },
    },
  });

  if (loanDetails.length === 0) {
    throw new NotFoundError("Loan not Found");
  }

  const loan = loanDetails[0].loan;

  const response = {
    loan_id: loan.loan_id,
    user_id: loan.user_id,
    status: loan.status,
    loan_date: loan.loan_date,
    return_date: loan.return_date,
    invited_users: [] as any[],
    products: [] as any[],
  };

  for (const item of loanDetails) {
    response.products.push({
      product_id: item.product.product_id,
      product_name: item.product.product_name,
      quantity: item.quantity,
    });

    if (item.borrower) {
      response.invited_users.push({
        borrower_id: item.borrower.user_id,
        borrower_name: item.borrower.name,
        borrower_username: item.borrower.username,
      });
    }
  }

  return response;
}
