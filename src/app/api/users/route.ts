import { NextResponse } from "next/server";
import { registerUser } from "@/app/service/supabase/UsersService";
import UsersValidator from "@/app/validator/users";
import NotFoundError from "@/app/exceptions/NotFoundError";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validation
    UsersValidator.validateUserPayload(body);

    const { name, username, password } = body;
    const user = await registerUser(name, username, password);

    if (!user) {
      throw new NotFoundError("User Id tidak ditemukan");
    }

    return NextResponse.json(
      {
        status: "success",
        data: { user },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "fail",
        message: error.message,
      },
      { status: error.statusCode || 400 }
    );
  }
}
