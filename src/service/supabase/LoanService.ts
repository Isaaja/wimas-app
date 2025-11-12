import { authenticate } from "@/app/utils/auth";
import { formatLoanResponse } from "@/app/utils/formatLoanResponse";
import InvariantError from "@/exceptions/InvariantError";
import NotFoundError from "@/exceptions/NotFoundError";
import { prisma } from "@/lib/prismaClient";
import {
  ParticipantRole,
  LoanStatus,
  ItemCondition,
  UnitStatus,
} from "@prisma/client";
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

  return prisma.loan.create({
    data: {
      loan_id: loanId,
      borrower_id: userId,
      status: LoanStatus.REQUESTED,

      requestItems: {
        create: items.map((item) => ({
          id: `lri-${nanoid(16)}`,
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      },

      participants: {
        create: [
          {
            id: `lp-${nanoid(16)}`,
            user_id: userId,
            role: ParticipantRole.OWNER,
          },
          ...invitedUsers.map((uid) => ({
            id: `lp-${nanoid(16)}`,
            user_id: uid,
            role: ParticipantRole.INVITED,
          })),
        ],
      },

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
  });
}

export async function approveLoanWithUnits(
  loanId: string,
  unitAssignments: { product_id: string; unit_ids: string[] }[]
) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { loan_id: loanId },
      include: {
        requestItems: true,
      },
    });

    if (!loan) throw new NotFoundError("Loan not found");

    if (loan.status !== LoanStatus.REQUESTED) {
      throw new InvariantError("Loan sudah diproses sebelumnya");
    }

    for (const req of loan.requestItems) {
      const assignment = unitAssignments.find(
        (a) => a.product_id === req.product_id
      );

      if (!assignment) {
        throw new InvariantError(
          `Unit untuk product ${req.product_id} belum dipilih`
        );
      }

      if (assignment.unit_ids.length !== req.quantity) {
        throw new InvariantError(
          `Jumlah unit untuk product ${req.product_id} tidak sesuai. Dibutuhkan: ${req.quantity}, Dipilih: ${assignment.unit_ids.length}`
        );
      }

      for (const unitId of assignment.unit_ids) {
        const unit = await tx.productUnit.findUnique({
          where: { unit_id: unitId },
        });

        if (!unit) {
          throw new NotFoundError(`Unit ${unitId} tidak ditemukan`);
        }

        if (unit.product_id !== req.product_id) {
          throw new InvariantError(
            `Unit ${unitId} bukan milik product ${req.product_id}`
          );
        }

        if (unit.status !== "AVAILABLE") {
          throw new InvariantError(
            `Unit ${unitId} tidak tersedia (Status: ${unit.status})`
          );
        }
      }
    }

    for (const assignment of unitAssignments) {
      for (const unitId of assignment.unit_ids) {
        await tx.loanItem.create({
          data: {
            loan_item_id: `li-${nanoid(16)}`,
            loan_id: loanId,
            product_id: assignment.product_id,
            unit_id: unitId,
          },
        });

        await tx.productUnit.update({
          where: { unit_id: unitId },
          data: { status: "LOANED" },
        });
      }
    }

    return tx.loan.update({
      where: { loan_id: loanId },
      data: { status: LoanStatus.APPROVED },
      include: {
        borrower: true,
        items: {
          include: {
            product: true,
            unit: true,
          },
        },
        report: true,
      },
    });
  });
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
      status: { in: ["REQUESTED", "APPROVED", "RETURNED"] },
    },
    orderBy: { created_at: "desc" },
  });

  if (!latestLoan) {
    return { canBorrow: true, reason: "Belum ada pinjaman aktif" };
  }

  let statusDescription = "";
  if (latestLoan.status === "REQUESTED") {
    statusDescription = "Menunggu persetujuan permintaan peminjaman barang.";
  } else if (latestLoan.status === "APPROVED") {
    statusDescription = "Anda Belum mengembalikan Barang pinjaman anda.";
  } else {
    statusDescription = `Status pinjaman: ${latestLoan.status}`;
  }

  return {
    canBorrow: false,
    reason: statusDescription,
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
      report: true,
      requestItems: {
        include: {
          product: {
            select: {
              product_id: true,
              product_name: true,
              product_image: true,
            },
          },
        },
      },
      items: {
        include: {
          product: {
            select: {
              product_id: true,
              product_name: true,
              product_image: true,
            },
          },
          unit: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
    take: 100,
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
      } else if (loan.status === "APPROVED") {
        throw new Error("Loan already approved");
      } else if (loan.status === "DONE") {
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
  return prisma.loan.update({
    where: { loan_id: loanId },
    data: { status: LoanStatus.RETURNED },
  });
}

export async function doneLoan(
  loanId: string,
  unitConditions: Record<string, string> = {}
) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { loan_id: loanId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!loan) throw new NotFoundError("Loan not found");
    if (loan.status !== "RETURNED")
      throw new InvariantError("Loan belum dikembalikan");

    for (const item of loan.items) {
      if (item.unit_id) {
        const conditionInput = unitConditions[item.unit_id] || "GOOD";

        const condition =
          conditionInput === "GOOD"
            ? ItemCondition.GOOD
            : ItemCondition.DAMAGED;
        const unitStatus =
          condition === ItemCondition.GOOD
            ? UnitStatus.AVAILABLE
            : UnitStatus.DAMAGED;

        await tx.productUnit.update({
          where: { unit_id: item.unit_id },
          data: {
            status: unitStatus,
            condition: condition,
          },
        });
      }
    }

    return tx.loan.update({
      where: { loan_id: loanId },
      data: {
        status: LoanStatus.DONE,
        updated_at: new Date(),
      },
    });
  });
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
      requestItems: {
        include: {
          product: {
            select: {
              product_id: true,
              product_name: true,
              product_image: true,
            },
          },
        },
      },
      items: {
        include: {
          product: {
            select: {
              product_id: true,
              product_name: true,
              product_image: true,
            },
          },
          unit: {
            select: {
              unit_id: true,
              serialNumber: true,
              status: true,
            },
          },
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
  const { user, error } = await authenticate();
  if (error) return error;

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
          requestItems: {
            include: {
              product: {
                select: {
                  product_id: true,
                  product_name: true,
                  product_image: true,
                },
              },
            },
          },
          items: {
            include: {
              product: {
                select: {
                  product_id: true,
                  product_name: true,
                  product_image: true,
                },
              },
              unit: {
                select: {
                  unit_id: true,
                  serialNumber: true,
                  status: true,
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

  const loans = userLoans.map((lp) => {
    const loan = lp.loan;

    let items: any[] = [];

    if (loan.status === "REQUESTED") {
      items = loan.requestItems.map((item) => ({
        product_id: item.product_id,
        product_name: item.product.product_name,
        product_image: item.product.product_image,
        quantity: item.quantity,
      }));
    } else {
      items = loan.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product.product_name,
        product_image: item.product.product_image,
        quantity: 1,
        loan_item_id: item.loan_item_id,
        unit_id: item.unit_id,
        serial_number: item.unit?.serialNumber,
        unit_status: item.unit?.status,
      }));
    }

    return {
      ...loan,
      items: items,
      userRole: lp.role,
      participantId: lp.id,
    };
  });

  return loans;
}

export async function updateLoanById(
  loanId: string,
  data: {
    items?: { product_id: string; quantity: number }[];
  }
) {
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUnique({
      where: { loan_id: loanId },
      include: { requestItems: true },
    });

    if (!loan) throw new InvariantError("Loan tidak ditemukan");

    if (loan.status !== "REQUESTED") {
      throw new InvariantError("Loan hanya dapat diubah saat REQUESTED");
    }

    if (data.items && data.items.length > 0) {
      const existingMap = new Map(
        loan.requestItems.map((i) => [i.product_id, i])
      );

      const newProductIds = new Set(data.items.map((i) => i.product_id));

      // Hapus item request yang tidak masuk list baru
      const itemsToRemove = loan.requestItems.filter(
        (i) => !newProductIds.has(i.product_id)
      );

      if (itemsToRemove.length > 0) {
        await tx.loanRequestItem.deleteMany({
          where: {
            id: {
              in: itemsToRemove.map((i) => i.id),
            },
          },
        });
      }

      // Tambah / update item
      for (const item of data.items) {
        if (item.quantity <= 0)
          throw new InvariantError("Quantity harus lebih dari 0");

        const existing = existingMap.get(item.product_id);

        if (existing) {
          // Update
          await tx.loanRequestItem.update({
            where: { id: existing.id },
            data: { quantity: item.quantity },
          });
        } else {
          // Insert baru
          await tx.loanRequestItem.create({
            data: {
              id: `lri-${nanoid(16)}`,
              loan_id: loanId,
              product_id: item.product_id,
              quantity: item.quantity,
            },
          });
        }
      }
    }

    return tx.loan.findUnique({
      where: { loan_id: loanId },
      include: {
        borrower: true,
        participants: true,
        requestItems: { include: { product: true } },
        report: true,
      },
    });
  });
}
