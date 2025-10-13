import { successResponse, errorResponse } from "@/app/utils/response";
import { authenticate } from "@/app/utils/auth";
import { prisma } from "@/lib/prismaClient";

export async function GET() {
  try {
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
            items: true,
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
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // 3. Transform data
    const loans = userLoans.map((lp) => ({
      ...lp.loan,
      userRole: lp.role,
      participantId: lp.id,
    }));

    return successResponse({
      loans,
      total: loans.length,
    });
  } catch (error: any) {
    return errorResponse(error);
  }
}
