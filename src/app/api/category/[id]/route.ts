import { checkAuth } from "@/app/utils/auth";
import {
  getCategoryById,
  updateCategoryById,
} from "@/service/supabase/CategoryService";
import CategoryValidator from "@/validator/category";
import { NextResponse } from "next/server";
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = await getCategoryById(id);
    return NextResponse.json({
      status: "success",
      data: {
        result,
      },
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    return NextResponse.json(
      { status: "fail", message: error.message || "Error updating product" },
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
    const { id } = await context.params;
    const body = await req.json();
    await CategoryValidator.validateProductPayload(body);
    const result = await updateCategoryById(id, body);
    return NextResponse.json(
      {
        status: "success",
        data: {
          result,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    return NextResponse.json(
      { status: "fail", message: error.message || "Error updating product" },
      { status: statusCode }
    );
  }
}
