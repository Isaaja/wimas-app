import { prisma } from "@/lib/prismaClient";

export async function getCategory() {
  const result = await prisma.category.findMany();

  return result;
}
