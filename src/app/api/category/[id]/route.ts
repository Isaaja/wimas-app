import { checkAuth } from "@/app/utils/auth";
import InvariantError from "@/exceptions/InvariantError";
import {
  deleteCategoryById,
  getCategoryById,
  updateCategoryById,
} from "@/service/supabase/CategoryService";
import CategoryValidator from "@/validator/category";
import { errorResponse, successResponse } from "@/app/utils/response";
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = await getCategoryById(id);
    return successResponse(result, "success", 200);
  } catch (error: any) {
    return errorResponse(error);
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
    await updateCategoryById(id, body);
    return successResponse("", "Berhasil memperbarui Category");
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await checkAuth("ADMIN");
    const { id } = await context.params;
    const result = await deleteCategoryById(id);
    if (!result) {
      throw new InvariantError("Gagal menghapus Category");
    }
    return successResponse("", "Berhasil menghapus Category");
  } catch (error: any) {
    return errorResponse(error);
  }
}
