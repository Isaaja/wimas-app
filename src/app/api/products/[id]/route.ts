import {
  getProductById,
  updateProductById,
  deleteProductById,
} from "@/service/supabase/ProductsService";
import ProductValidator from "@/validator/products";
import { checkAuth } from "@/app/utils/auth";
import { successResponse, errorResponse } from "@/app/utils/response";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const item = await getProductById(id);

    return successResponse(item, "Successfully retrieved product");
  } catch (error: any) {
    return errorResponse(error, "Failed to retrieve product");
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

    const { product_name, product_image, quantity, category_id, units } = body;

    const result = await updateProductById(id, {
      product_name,
      product_image,
      quantity,
      category_id,
      units,
    });

    return successResponse(result, "Product updated successfully", 200);
  } catch (error: any) {
    return errorResponse(error, "Failed to update product");
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

    return successResponse(undefined, "Product deleted successfully");
  } catch (error: any) {
    return errorResponse(error, "Failed to delete product");
  }
}
