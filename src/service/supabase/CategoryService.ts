import InvariantError from "@/exceptions/InvariantError";
import NotFoundError from "@/exceptions/NotFoundError";
import { prisma } from "@/lib/prismaClient";

export async function getCategory() {
  const result = await prisma.category.findMany();

  return result;
}

async function checkCategoryName(category_name: string) {
  const existingProduct = await prisma.category.findFirst({
    where: {
      category_name: {
        equals: category_name,
        mode: "insensitive",
      },
    },
  });
  if (existingProduct) {
    throw new InvariantError("Nama Category sudah ada");
  }
}

export async function getCategoryById(id: string) {
  const result = await prisma.category.findUnique({
    where: { category_id: id },
  });
  if (!result) {
    throw new NotFoundError("Category not Found");
  }
  return result;
}

export async function updateCategoryById(
  id: string,
  data: {
    category_name: string;
  }
) {
  try {
    await checkCategoryName(data.category_name);
    const result = await prisma.category.update({
      where: { category_id: id },
      data,
    });
    return result;
  } catch (error: any) {
    throw new InvariantError(error.message || "Failed to update Category");
  }
}
export async function deleteCategoryById(id: string) {
  try {
    const result = await prisma.category.delete({
      where: { category_id: id },
    });
    return result;
  } catch (error: any) {
    throw new InvariantError(error.message || "Failed to Delete Category");
  }
}
