import { NextResponse } from "next/server";
import {
  getProductById,
  updateProductById,
  deleteProductById,
} from "@/service/supabase/ProductsService";
import ProductValidator from "@/validator/products";
import { checkAuth } from "@/app/utils/auth";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const item = await getProductById(id);

    return NextResponse.json({
      status: "success",
      data: { item },
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      { status: "fail", message: error.message || "Error retrieving item" },
      { status: statusCode }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await checkAuth("ADMIN");

    const body = await req.json();
    await ProductValidator.validateProductPayload(body);

    const { id } = await context.params;

    const result = await updateProductById(id, body);

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
    const statusCode = error.statusCode || 400;
    return NextResponse.json(
      { status: "fail", message: error.message || "Error updating product" },
      { status: statusCode }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await checkAuth("ADMIN");
    const { id } = await context.params;
    await deleteProductById(id);
    return NextResponse.json({
      status: "success",
      message: "Berhasil menghapus Product",
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return NextResponse.json(
      { status: "fail", message: error.message || "Error updating product" },
      { status: statusCode }
    );
  }
}
