import { checkAuth } from "@/app/utils/auth";
import { prisma } from "@/lib/prismaClient";
import { successResponse, errorResponse } from "@/app/utils/response";

export async function GET() {
  try {
    await checkAuth("ADMIN");

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      productsData,
      usersData,
      loansData,
      allProducts,
      pendingLoans,
      recentLoansCount,
      allLoansForStats,
      recentUsers,
      outOfStockCount,
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
          units: {
            where: {
              status: "AVAILABLE",
              condition: "GOOD",
            },
            select: {
              unit_id: true,
              status: true,
              condition: true,
            },
          },
        } as any,
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
          requestItems: {
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
        } as any,
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
              product: {
                select: {
                  product_id: true,
                  product_name: true,
                },
              },
            },
          },
          requestItems: {
            select: {
              product_id: true,
              quantity: true,
              product: {
                select: {
                  product_id: true,
                  product_name: true,
                },
              },
            },
          },
        },
        where: {
          created_at: {
            gte: sixMonthsAgo,
          },
          status: {
            in: ["APPROVED", "RETURNED", "DONE"],
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

      prisma.product.count({
        where: {
          units: {
            none: {
              status: "AVAILABLE",
              condition: "GOOD",
            },
          },
        },
      }),
    ]);

    const lowStockProducts = allProducts
      .map((product) => ({
        product_id: product.product_id,
        product_name: product.product_name,
        product_avaible: product.units.length,
        category: product.category,
      }))
      .filter((product) => product.product_avaible < 10)
      .sort((a, b) => a.product_avaible - b.product_avaible)
      .slice(0, 5);

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

    const transformedPendingLoans = pendingLoans.map((loan) => {
      const totalItems = loan.requestItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      const productSummary = loan.requestItems.map((item) => ({
        product_name: item.product.product_name,
        quantity: item.quantity,
      }));

      return {
        loan_id: loan.loan_id,
        status: loan.status,
        created_at: loan.created_at,
        borrower: loan.borrower,
        items: productSummary,
        totalItems,
      };
    });

    interface ProductCount {
      product_id: string;
      product_name: string;
      count: number;
    }

    const productBorrowCount: Record<string, ProductCount> = {};

    const transformedAllLoans = allLoansForStats.map((loan) => {
      interface ProductItem {
        product_id: string;
        product_name: string;
        quantity: number;
      }

      const itemsByProduct: Record<string, ProductItem> = {};

      loan.items.forEach((item) => {
        const productId = item.product_id;
        const productName = item.product.product_name;

        if (!productBorrowCount[productId]) {
          productBorrowCount[productId] = {
            product_id: productId,
            product_name: productName,
            count: 0,
          };
        }
        productBorrowCount[productId].count += 1;

        if (!itemsByProduct[productId]) {
          itemsByProduct[productId] = {
            product_id: productId,
            product_name: productName,
            quantity: 0,
          };
        }
        itemsByProduct[productId].quantity += 1;
      });

      const productData = Object.values(itemsByProduct);

      return {
        loan_id: loan.loan_id,
        status: loan.status,
        created_at: loan.created_at,
        items: productData,
      };
    });

    const mostBorrowedProducts = Object.values(productBorrowCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        borrow_count: item.count,
      }));

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
      pendingLoans: transformedPendingLoans,
      allLoans: transformedAllLoans,
      mostBorrowedProducts,
      recentUsers,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
