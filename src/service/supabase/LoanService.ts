import { authenticate } from "@/app/utils/auth";
import { formatLoanResponse } from "@/app/utils/formatLoanResponse";
import InvariantError from "@/exceptions/InvariantError";
import NotFoundError from "@/exceptions/NotFoundError";
import { prisma } from "@/lib/prismaClient";
import { ParticipantRole, LoanStatus } from "@prisma/client";
import { nanoid } from "nanoid";

export async function createLoan({
  userId,
  invitedUsers = [],
  items,
  report,
}: {
  userId: string;
  invitedUsers: string[];
  items: { product_id: string; quantity: number }[];
  report: {
    spt_file: string | null;
    spt_number: string;
    destination: string;
    place_of_execution: string;
    start_date: string;
    end_date: string;
  };
}) {
  const loanId = `loan-${nanoid(16)}`;

  const loan = await prisma.$transaction(
    async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          loan_id: loanId,
          borrower_id: userId,
          status: "REQUESTED",

          // ✅ Buat item pinjaman
          items: {
            create: items.map((item) => ({
              loan_item_id: `li-${nanoid(16)}`,
              product_id: item.product_id,
              quantity: item.quantity,
            })),
          },

          // ✅ Buat peserta pinjaman
          participants: {
            create: [
              {
                id: `lp-${nanoid(16)}`,
                user_id: userId,
                role: "OWNER" as ParticipantRole,
              },
              ...invitedUsers.map((uid) => ({
                id: `lp-${nanoid(16)}`,
                user_id: uid,
                role: "INVITED" as ParticipantRole,
              })),
            ],
          },

          // ✅ Buat report (spt_file di dalamnya)
          report: {
            create: {
              report_id: `rep-${nanoid(16)}`,
              spt_file: report.spt_file,
              spt_number: report.spt_number,
              destination: report.destination,
              place_of_execution: report.place_of_execution,
              start_date: new Date(report.start_date),
              end_date: new Date(report.end_date),
            },
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
          report: true,
        },
      });

      return { data: newLoan };
    },
    { timeout: 15000, maxWait: 5000 }
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
      report: {
        select: {
          report_id: true,
          spt_file: true,
          spt_number: true,
          destination: true,
          place_of_execution: true,
          start_date: true,
          end_date: true,
        },
      },
      items: {
        include: {
          product: { select: { product_id: true, product_name: true } },
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    take: 100, // Limit hasil jika terlalu banyak
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

export async function returnLoan(loanId: string) {
  return prisma.$transaction(
    async (tx) => {
      // Ambil data pinjaman beserta itemnya
      const loan = await tx.loan.findUnique({
        where: { loan_id: loanId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!loan) throw new NotFoundError("Loan not found");

      if (loan.status === "APPROVED") {
        // Tambah kembali stok barang
        await Promise.all(
          (loan.items as Array<{ product_id: string; quantity: number }>).map(
            (item) =>
              tx.product.update({
                where: { product_id: item.product_id },
                data: {
                  product_avaible: { increment: item.quantity },
                },
              })
          )
        );

        // Update status pinjaman menjadi RETURNED
        const updatedLoan = await tx.loan.update({
          where: { loan_id: loanId },
          data: { status: "RETURNED" },
        });

        return updatedLoan;
      } else {
        throw new InvariantError("Can't Return Item");
      }
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
      report: true,
    },
  });

  if (!loan) {
    throw new Error("Loan not found");
  }

  return formatLoanResponse(loan);
}

export async function getHistoryLoan() {
  // 1. Authenticate user
  const { user, error } = await authenticate();
  if (error) return error;

  // 2. Query loan history
  const userLoans = await prisma.loanParticipant.findMany({
    where: {
      user_id: user!.user_id,
    },
    include: {
      loan: {
        include: {
          borrower: {
            select: {
              user_id: true,
              username: true,
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  product_id: true,
                  product_name: true,
                  quantity: true,
                  product_image: true,
                },
              },
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  user_id: true,
                  username: true,
                  name: true,
                },
              },
            },
          },
          report: {
            select: {
              report_id: true,
              spt_file: true,
              spt_number: true,
              destination: true,
              place_of_execution: true,
              start_date: true,
              end_date: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    take: 100,
  });

  // 3. Transform data
  const loans = userLoans.map((lp) => ({
    ...lp.loan,
    items: lp.loan.items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product.product_name,
      quantity: item.quantity,
      product_image: item.product_image
    })),
    userRole: lp.role,
    participantId: lp.id,
  }));
  return loans;
}

export async function updateLoanById(
  loanId: string,
  data: {
    items?: { product_id: string; quantity: number }[];
  }
) {
  return prisma.$transaction(
    async (tx) => {
      // Check if loan exists
      const loan = await tx.loan.findUnique({
        where: { loan_id: loanId },
        include: { items: true },
      });

      if (!loan) throw new InvariantError("Loan tidak ditemukan");

      // Validate loan status for updates
      if (loan.status === "APPROVED" || loan.status === "RETURNED") {
        throw new InvariantError(
          "Tidak dapat mengubah loan yang sudah disetujui atau dikembalikan"
        );
      }

      // Update loan items if provided
      if (data.items && data.items.length > 0) {
        // Get existing items mapped by product_id
        const existingItemsMap = new Map(
          loan.items.map((i) => [i.product_id, i])
        );
        const newProductIds = new Set(
          data.items.map((item) => item.product_id)
        );

        // Remove items that are not in the new items list
        const itemsToRemove = loan.items.filter(
          (item) => !newProductIds.has(item.product_id)
        );
        if (itemsToRemove.length > 0) {
          await tx.loanItem.deleteMany({
            where: {
              loan_item_id: {
                in: itemsToRemove.map((item) => item.loan_item_id),
              },
            },
          });
        }

        // Process each item in the update request
        for (const item of data.items) {
          if (item.quantity <= 0) {
            throw new InvariantError(
              `Quantity untuk produk ${item.product_id} harus lebih dari 0`
            );
          }

          const existing = existingItemsMap.get(item.product_id);

          if (existing) {
            // Update existing item quantity
            await tx.loanItem.update({
              where: { loan_item_id: existing.loan_item_id },
              data: { quantity: item.quantity },
            });
          } else {
            // Add new item to the loan
            const { nanoid } = await import("nanoid");
            await tx.loanItem.create({
              data: {
                loan_item_id: `li-${nanoid(16)}`,
                loan_id: loanId,
                product_id: item.product_id,
                quantity: item.quantity,
              },
            });
          }
        }
      }

      // Return updated loan with all relations
      const updatedLoan = await tx.loan.findUnique({
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
          report: true,
        },
      });

      return updatedLoan;
    },
    {
      timeout: 15000,
      maxWait: 5000,
    }
  );
}
