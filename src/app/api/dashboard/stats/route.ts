import { checkAuth } from "@/app/utils/auth";
import { prisma } from "@/lib/prismaClient";
import { successResponse, errorResponse } from "@/app/utils/response";

export async function GET() {
  try {
    await checkAuth("ADMIN");

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      productsData,
      usersData,
      loansData,
      lowStockProducts,
      pendingLoans,
      recentLoansCount,
      allLoansForStats,
      recentUsers,
    ] = await Promise.all([
      prisma.product.aggregate({
        _count: true,
        _sum: {
          product_avaible: true,
        },
      }),
      prisma.user.groupBy({
        by: ["role"],
        _count: true,
      }),
      prisma.loan.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.product.findMany({
        select: {
          product_id: true,
          product_name: true,
          product_avaible: true,
          category: {
            select: {
              category_name: true,
            },
          },
        },
        where: {
          product_avaible: {
            lt: 10,
          },
        },
        orderBy: {
          product_avaible: "asc",
        },
        take: 5,
      }),
      prisma.loan.findMany({
        select: {
          loan_id: true,
          status: true,
          created_at: true,
          borrower: {
            select: {
              name: true,
              username: true,
            },
          },
          items: {
            select: {
              product: {
                select: {
                  product_name: true,
                },
              },
              quantity: true,
            },
          },
        },
        where: {
          status: "REQUESTED",
        },
        take: 5,
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.loan.count({
        where: {
          created_at: {
            gte: oneWeekAgo,
          },
        },
      }),
      prisma.loan.findMany({
        select: {
          loan_id: true,
          status: true,
          created_at: true,
          items: {
            select: {
              product_id: true,
              quantity: true,
              product: {
                select: {
                  product_name: true,
                },
              },
            },
          },
        },
        where: {
          created_at: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.user.findMany({
        select: {
          user_id: true,
          name: true,
          username: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      }),
    ]);

    const loanStats = loansData.reduce(
      (acc, curr) => {
        acc[curr.status.toLowerCase()] = curr._count;
        return acc;
      },
      {
        requested: 0,
        approved: 0,
        rejected: 0,
        returned: 0,
        done: 0, 
      } as Record<string, number>
    );

    const userStats = usersData.reduce(
      (acc, curr) => {
        if (curr.role === "ADMIN") acc.admin = curr._count;
        else if (curr.role === "BORROWER") acc.borrower = curr._count;
        return acc;
      },
      { admin: 0, borrower: 0 }
    );

    const outOfStockCount = await prisma.product.count({
      where: { product_avaible: 0 },
    });

    return successResponse({
      stats: {
        totalProducts: productsData._count,
        totalAvailableProducts: productsData._sum.product_avaible || 0,
        outOfStockProducts: outOfStockCount,
        lowStockProducts: lowStockProducts.length,
        totalUsers: userStats.admin + userStats.borrower,
        adminUsers: userStats.admin,
        borrowerUsers: userStats.borrower,
        totalLoans: Object.values(loanStats).reduce((a, b) => a + b, 0),
        pendingLoans: loanStats.requested || 0,
        approvedLoans: loanStats.approved || 0,
        rejectedLoans: loanStats.rejected || 0,
        returnedLoans: loanStats.returned || 0,
        doneLoans: loanStats.done || 0, 
        recentLoans: recentLoansCount,
      },
      lowStockProducts,
      pendingLoans,
      allLoans: allLoansForStats,
      recentUsers,
    });
  } catch (error) {
    return errorResponse(error);
  }
}