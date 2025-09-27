import { prisma } from "@/lib/prismaClient";
import { NextResponse } from "next/server";
export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
  });

  return NextResponse.json({
    status: "success",
    data: products,
  });
}
