import {
  getProductById,
  updateProductById,
  deleteProductById,
} from "@/service/supabase/ProductsService";
import ProductValidator from "@/validator/products";
import { checkAuth } from "@/app/utils/auth";
import { successResponse, errorResponse } from "@/app/utils/response";

// =============================
// GET PRODUCT BY ID
// =============================
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

// =============================
// UPDATE PRODUCT
// =============================
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await checkAuth("ADMIN");

    const body = await req.json();

    // ✅ Validasi body termasuk units
    await ProductValidator.validateProductPayload(body);

    const { id } = await context.params;

    // ✅ Pisahkan product fields dan units
    const {
      product_name,
      product_image,
      quantity,
      category_id,
      product_avaible,
      units,
    } = body;

    const result = await updateProductById(id, {
      product_name,
      product_image,
      quantity,
      category_id,
      product_avaible,
      units, // ✅ pass units ke service
    });

    return successResponse(result, "Product updated successfully", 200);
  } catch (error: any) {
    return errorResponse(error, "Failed to update product");
  }
}

// =============================
// DELETE PRODUCT
// =============================
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
