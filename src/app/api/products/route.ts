import { prisma } from "@/lib/prismaClient";
import { NextRequest, NextResponse } from "next/server";
import ProductValidator from "@/validator/products";
import { addProduct } from "@/service/supabase/ProductsService";
import InvariantError from "@/exceptions/InvariantError";
import { checkAuth } from "@/app/utils/auth";
import { Prisma } from "@prisma/client";
import { errorResponse, successResponse } from "@/app/utils/response";
import { handleImageUpload } from "@/app/utils/fileupload";
import { rateLimiter } from "@/lib/rateLimiter";

export async function GET(req: NextRequest) {
  try {
     const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const rateLimit = await rateLimiter({
      key: ip,
      limit: 5,
      window: 60,
    });

    if (!rateLimit.allowed) {
      return errorResponse('fail',
        `Too many requests. Try again in ${rateLimit.reset}s`, 429
      );
    }

    const { searchParams } = new URL(req.url);

    const productName = searchParams.get("product_name");

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 100);
    const skip = (page - 1) * limit;

    const sort = searchParams.get("sort") || "createdAt";
    const order =
      searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Prisma.ProductWhereInput = productName
      ? {
          product_name: {
            contains: productName,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

     const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          units: true,
        },
        orderBy: {
          [sort]: order,
        },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return successResponse({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      sorting: {
        sort,
        order,
      }
        },
         "Successfully fetched products");
  } catch (error) {
    console.error("Error fetching products:", error);
    return errorResponse("Internal Server Error");
  }
}

export async function POST(req: Request) {
  try {
    await checkAuth("ADMIN");

    const contentType = req.headers.get("content-type") || "";

    let productData;
    let productImageUrl = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      const productDataJson = formData.get("productData") as string;

      if (!productDataJson) {
        throw new Error("productData is missing in form data");
      }

      productData = JSON.parse(productDataJson);

      const imageFile = formData.get("image") as File;
      if (imageFile) {
        productImageUrl = await handleImageUpload(imageFile);
      } else if (productData.product_image) {
        productImageUrl = productData.product_image;
      }
    } else {
      const body = await req.json();
      productData = body;
      productImageUrl = body.product_image || "";
    }

    console.log("BODY API:", productData);

    const { product_name, quantity, category_id, units } = productData;

    const payloadToValidate = {
      ...productData,
      product_image: productImageUrl,
    };

    ProductValidator.validateProductPayload(payloadToValidate);

    const result = await addProduct({
      product_name,
      product_image: productImageUrl,
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
