import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
import { prisma } from "@/lib/prismaClient";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await checkAuth();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    if (!id) {
      return errorResponse({ message: "Product ID is required" });
    }

    const whereClause: any = {
      product_id: id,
    };

    if (status) {
      whereClause.status = status;
    }

    const units = await prisma.productUnit.findMany({
      where: whereClause,
      orderBy: {
        serialNumber: "asc",
      },
      select: {
        unit_id: true,
        serialNumber: true,
        status: true,
        product_id: true,
        createdAt: true,
      },
    });

    return successResponse(units, `Found ${units.length} unit(s)`);
  } catch (error: any) {
    return errorResponse(error);
  }
}
