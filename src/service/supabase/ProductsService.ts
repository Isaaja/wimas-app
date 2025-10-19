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
  product_image: string | undefined,
  quantity: number,
  category_id: string,
  product_avaible: number
) {
  await checkProduckName(product_name);
  const defaultImage =
    product_image && product_image.trim() !== ""
      ? product_image
      : "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  const product_id = `product-${nanoid(16)}`;
  const product = await prisma.product.create({
    data: {
      product_id: product_id,
      product_name,
      product_image: defaultImage,
      quantity,
      category_id,
      product_avaible,
    },
  });

  return product;
}

async function checkProduckName(product_name: string) {
  const existingProduct = await prisma.product.findFirst({
    where: {
      product_name: {
        equals: product_name,
        mode: "insensitive",
      },
    },
  });
  if (existingProduct) {
    throw new InvariantError("Nama Produk sudah ada");
  }
}
export async function updateProductById(
  id: string,
  data: {
    product_name: string;
    product_image?: string;
    quantity: number;
    category_id: string;
    product_avaible: number;
  }
) {
  try {
    const updatedProduct = await prisma.product.update({
      where: { product_id: id },
      data,
    });

    return updatedProduct;
  } catch (error: any) {
    throw new InvariantError(error.message || "Failed to update Product");
  }
}
export async function deleteProductById(id: string) {
  try {
    const result = await prisma.product.delete({
      where: { product_id: id },
    });
    return result;
  } catch (error: any) {
    throw new InvariantError(error.message || "Failed to Delete Product");
  }
}

export async function getProductsWithQuantity(
  items: { product_id: string; quantity: number }[]
) {
  if (!items || items.length === 0) return [];

  const ids = items.map((i) => i.product_id);

  const products = await prisma.product.findMany({
    where: { product_id: { in: ids } },
    select: {
      product_id: true,
      product_name: true,
      quantity: true,
      category: {
        select: {
          category_id: true,
          category_name: true,
        },
      },
    },
  });

  const productMap = products.reduce<Record<string, any>>((acc, p) => {
    acc[p.product_id] = p;
    return acc;
  }, {});

  return items.map((item) => {
    const product = productMap[item.product_id];
    if (!product)
      throw new NotFoundError(`Product ${item.product_id} not found`);
    return {
      ...product,
      quantity: item.quantity,
    };
  });
}
