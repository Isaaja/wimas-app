import InvariantError from "@/exceptions/InvariantError";
import NotFoundError from "@/exceptions/NotFoundError";
import { prisma } from "@/lib/prismaClient";
import { nanoid } from "nanoid";
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

export async function addProduct(
  product_name: string,
  product_image: string,
  quantity: number,
  category_id: string,
  product_avaible: number,
  status: string
) {
  await checkProduckName(product_name);
  const product_id = `product-${nanoid(16)}`;
  const product = await prisma.product.create({
    data: {
      product_id: product_id,
      product_name,
      product_image,
      quantity,
      category_id,
      product_avaible,
      status,
    },
  });

  return product;
}

async function checkProduckName(product_name: string) {
  const existingProduct = await prisma.product.findUnique({
    where: { product_name },
  });
  if (existingProduct) {
    throw new InvariantError("Nama Produk sudah ada");
  }
}
