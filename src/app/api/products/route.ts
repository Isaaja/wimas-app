import { prisma } from "@/lib/prismaClient";
import { NextRequest } from "next/server";
import ProductValidator from "@/validator/products";
import { addProduct } from "@/service/supabase/ProductsService";
import InvariantError from "@/exceptions/InvariantError";
import { checkAuth } from "@/app/utils/auth";
import { Prisma } from "@prisma/client";
import { errorResponse, successResponse } from "@/app/utils/response";

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
      include: { category: true, units: true },
      orderBy: { [sort]: order === "asc" ? "asc" : "desc" },
    });

    return successResponse(products, "Successfully fetched products");
  } catch (error) {
    console.error("Error fetching products:", error);
    return errorResponse("Internal Server Error");
  }
}

export async function POST(req: Request) {
  try {
    await checkAuth("ADMIN");

    const body = await req.json();
    console.log("BODY API:", body);

    const { product_name, product_image, quantity, category_id, units } = body;

    ProductValidator.validateProductPayload(body);

    const result = await addProduct({
      product_name,
      product_image,
      quantity,
      category_id,
      units,
    });

    if (!result) throw new InvariantError("Failed to add product");

    return successResponse(result, "Product added successfully", 201);
  } catch (error: any) {
    console.error("🔥 ERROR PRISMA:", error);
    return errorResponse(
      error.message || "An error occurred",
      error.statusCode || 400
    );
  }
}
