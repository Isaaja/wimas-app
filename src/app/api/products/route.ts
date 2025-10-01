import { prisma } from "@/lib/prismaClient";
import { NextResponse } from "next/server";
import ProductValidator from "@/validator/products";
import { addProduct } from "@/service/supabase/ProductsService";
import InvariantError from "@/exceptions/InvariantError";
import { checkAuth } from "@/app/utils/auth";

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

export async function POST(req: Request) {
  try {
    const {
      product_name,
      product_image,
      quantity,
      category_id,
      product_avaible,
      status,
    } = await req.json();
    await checkAuth("ADMIN");
    await ProductValidator.validateProductPayload({
      product_name,
      product_image,
      quantity,
      category_id,
      product_avaible,
      status,
    });
    const result = await addProduct(
      product_name,
      product_image,
      quantity,
      category_id,
      product_avaible,
      status
    );
    if (!result) {
      throw new InvariantError("Gagal menambahkan barang");
    }
    return NextResponse.json(
      {
        status: "success",
        data: {
          result,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "fail",
        message: error.message || "Terjadi kesalahan",
      },
      { status: error.statusCode || 400 }
    );
  }
}
