import {
  updateUserById,
  deleteUserById,
} from "@/service/supabase/UsersService";
import { NextRequest } from "next/server";
import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await checkAuth("BORROWER");

    const body = await req.json();
    const { id } = await context.params;

    const result = await updateUserById(id, body);

    return successResponse(result.data, "User updated successfully");
  } catch (error: any) {
    return errorResponse(
      error.message || "An error occurred",
      error.statusCode || 400
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await checkAuth("");

    const { id } = await context.params;
    const result = await deleteUserById(id);

    return successResponse(result, "User deleted successfully");
  } catch (error: any) {
    return errorResponse(
      error.message || "An error occurred",
      error.statusCode || 400
    );
  }
}
