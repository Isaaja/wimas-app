import { NextResponse } from "next/server";
import { addUser } from "@/app/service/supabase/UsersService";
import UsersValidator from "@/app/validator/users";
import NotFoundError from "@/app/exceptions/NotFoundError";

export async function POST(req: Request) {
  const { name, username, password, email, noHandphone } = await req.json();

  try {
    // Validation
    UsersValidator.validateUserPayload({
      name,
      username,
      password,
      email,
      noHandphone,
    });

    const user = await addUser(name, username, password, email, noHandphone);

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
