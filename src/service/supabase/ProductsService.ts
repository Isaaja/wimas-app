import InvariantError from "@/exceptions/InvariantError";
import NotFoundError from "@/exceptions/NotFoundError";
import { prisma } from "@/lib/prismaClient";
import { nanoid } from "nanoid";

// =====================================
// GET PRODUCT BY ID
// =====================================
export async function getProductById(id: string) {
  const item = await prisma.product.findUnique({
    where: { product_id: id },
    include: {
      category: true,
      units: true,
    },
  });

  if (!item) {
    throw new NotFoundError("Item not found");
  }

  return item;
}

// =====================================
// CHECK NAME
// =====================================
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

// =====================================
// ✅ CREATE PRODUCT + CREATE UNITS
// =====================================

/**
 * Sekarang Product CREATE:
 * - Buat product dulu
 * - Lalu buat productUnit sebanyak quantity
 * - serialNumber manual (user input)
 */
export async function addProduct(payload: any) {
  const { product_name, product_image, quantity, category_id, units } = payload;

  await checkProduckName(product_name);

  if (units.length !== quantity) {
    throw new InvariantError(
      "Jumlah serial number (units) harus sama dengan quantity"
    );
  }

  const product_id = `product-${nanoid(16)}`;
  const defaultImage =
    product_image && product_image.trim() !== "" ? product_image : null;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        product_id,
        product_name,
        product_image: defaultImage,
        quantity,
        category_id,
      },
    });

    for (const u of units) {
      await tx.productUnit.create({
        data: {
          unit_id: `unit-${nanoid(16)}`,
          product_id: product_id,
          serialNumber: u.serialNumber,
          status: "AVAILABLE",
          condition: "GOOD",
        },
      });
    }

    return product;
  });
}

// =====================================
// ✅ UPDATE PRODUCT (unit tidak disentuh)
// =====================================
export async function updateProductById(
  id: string,
  data: {
    product_name?: string;
    product_image?: string;
    quantity?: number;
    category_id?: string;
    units?: { serialNumber: string }[];
  }
) {
  try {
    // ====== Pisahkan units dari field Product ======
    const { units = [], ...productData } = data;

    // ====== Ambil semua unit yang sudah ada ======
    const existingUnits = await prisma.productUnit.findMany({
      where: { product_id: id },
    });

    const existingSerials = existingUnits.map((u) => u.serialNumber);

    // ====== SerialNumber yang dikirim dari FE ======
    const newSerials = units.map((u) => u.serialNumber);

    // ====== Unit yang perlu dihapus ======
    const unitsToDelete = existingUnits
      .filter((u) => !newSerials.includes(u.serialNumber))
      .map((u) => u.unit_id);

    // ====== Unit yang perlu dibuat ======
    const unitsToCreate = units
      .filter((u) => !existingSerials.includes(u.serialNumber))
      .map((u) => ({
        unit_id: crypto.randomUUID().replace(/-/g, ""),
        serialNumber: u.serialNumber,
      }));

    // ====== Unit yang perlu di-update ======
    const unitsToUpdate = existingUnits
      .filter((u) => newSerials.includes(u.serialNumber))
      .map((u) => ({
        unit_id: u.unit_id,
        serialNumber: u.serialNumber,
      }));

    // ====== Eksekusi update ======
    const result = await prisma.product.update({
      where: { product_id: id },
      data: {
        ...productData, // hanya field Product
        units: {
          deleteMany: {
            unit_id: { in: unitsToDelete },
          },
          create: unitsToCreate,
          update: unitsToUpdate.map((u) => ({
            where: { unit_id: u.unit_id },
            data: {
              serialNumber: u.serialNumber,
            },
          })),
        },
      },
      include: { units: true },
    });

    return result;
  } catch (error: any) {
    console.log("prisma:error", error);
    throw new InvariantError(error.message || "Failed to update Product");
  }
}

export async function updateUnitCondition(
  unit_id: string,
  condition: "GOOD" | "DAMAGED",
  note?: string
) {
  try {
    const unit = await prisma.productUnit.findUnique({
      where: { unit_id },
      include: { product: true },
    });

    if (!unit) {
      throw new NotFoundError("Unit tidak ditemukan");
    }

    const updatedUnit = await prisma.productUnit.update({
      where: { unit_id },
      data: {
        condition,
        status: "AVAILABLE",
        note: note || unit.note,
        updatedAt: new Date(),
      },
      include: {
        product: true,
      },
    });

    // Note: Available count is calculated from units filtering using getAvailableCount()
    // No need to manually update availability

    return updatedUnit;
  } catch (error: any) {
    throw new InvariantError(error.message || "Gagal memperbarui kondisi unit");
  }
}

export async function deleteUnit(unit_id: string) {
  try {
    const unit = await prisma.productUnit.findUnique({
      where: { unit_id },
      include: { product: true },
    });

    if (!unit) {
      throw new NotFoundError("Unit tidak ditemukan");
    }

    await prisma.productUnit.delete({
      where: { unit_id },
    });

    const newQuantity = unit.product.quantity - 1;

    await prisma.product.update({
      where: { product_id: unit.product_id },
      data: {
        quantity: newQuantity,
      },
    });

    return unit;
  } catch (error: any) {
    throw new InvariantError(error.message || "Gagal menghapus unit");
  }
}

// =====================================
// ✅ DELETE PRODUCT + CASCADE DELETE UNIT
// =====================================
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

// =====================================
// ✅ GET PRODUCT WITH CUSTOM QUANTITY
// (untuk loan request)
// =====================================
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
