import { prisma } from "@/lib/prismaClient";
import { NextRequest, NextResponse } from "next/server";
import ProductValidator from "@/validator/products";
import { addProduct } from "@/service/supabase/ProductsService";
import InvariantError from "@/exceptions/InvariantError";
import { checkAuth } from "@/app/utils/auth";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productName = searchParams.get("product_name");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where = productName
      ? {
          product_name: {
            contains: productName,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        [sort]: order === "asc" ? "asc" : "desc",
      },
    });

    return NextResponse.json(
      {
        status: "success",
        data: products,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      product_name,
      product_image,
      quantity,
      category_id,
      product_avaible,
    } = await req.json();
    await checkAuth("ADMIN");
    await ProductValidator.validateProductPayload({
      product_name,
      product_image,
      quantity,
      category_id,
      product_avaible,
    });
    const result = await addProduct(
      product_name,
      product_image,
      quantity,
      category_id,
      product_avaible,
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
