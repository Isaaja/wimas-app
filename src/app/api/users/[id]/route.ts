import {
  updateUserById,
  deleteUserById,
} from "@/service/supabase/UsersService";
import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/app/utils/auth";
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await checkAuth("BORROWER");
    const body = await req.json();
    const { id } = await context.params;
    const result = await updateUserById(id, body);
    if (result.status === "error") {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "fail",
        message: error.message || "Terjadi kesalahan",
      },
      { status: error.statusCode || 400 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await checkAuth("SUPERADMIN");
    const { id } = await context.params;

    const result = await deleteUserById(id);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "fail",
        message: error.message || "Terjadi kesalahan",
      },
      { status: error.statusCode || 400 }
    );
  }
}
