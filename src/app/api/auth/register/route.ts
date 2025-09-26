import { NextResponse } from "next/server";
import { registerUser } from "@/app/service/supabase/UsersService";
import UserPayloadSchema from "@/app/validator/users/schema";
import InvariantError from "@/app/exceptions/InvariantError";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    //Validation
    const { error, value } = UserPayloadSchema.validate(body, {
      abortEarly: false,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          errors: error.details.map((err) => ({
            message: err.message,
            path: err.path,
          })),
        },
        { status: 400 }
      );
    }

    const { name, username, password } = value;
    const user = await registerUser(name, username, password);

    if (!user) {
      throw new InvariantError("User Id tidak ditemukan");
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}
