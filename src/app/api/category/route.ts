import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
import InvariantError from "@/exceptions/InvariantError";
import NotFoundError from "@/exceptions/NotFoundError";
import { addCategory, getCategory } from "@/service/supabase/CategoryService";
import CategoryValidator from "@/validator/category";

export async function GET() {
  try {
    const result = await getCategory();
    if (result.length <= 0) {
      throw new NotFoundError("Tidak ada kategori");
    }
    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    await checkAuth("ADMIN");
    const body = await req.json();
    const { category_name } = body;
    await CategoryValidator.validateProductPayload(body);
    const result = await addCategory(category_name);

    return successResponse(result, "", 201);
  } catch (error) {
    return errorResponse(error, "Failed to Add Category2");
  }
}
