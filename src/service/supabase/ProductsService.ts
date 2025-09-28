import NotFoundError from "@/exceptions/NotFoundError";
import { prisma } from "@/lib/prismaClient";

export async function getProductById(id: string) {
  const item = await prisma.product.findUnique({
    where: {
      product_id: id,
    },
  });

  if (!item) {
    throw new NotFoundError("Item not found");
  }

  return item;
}
