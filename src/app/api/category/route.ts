import { errorResponse, successResponse } from "@/app/utils/response";
import NotFoundError from "@/exceptions/NotFoundError";
import { getCategory } from "@/service/supabase/CategoryService";

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
