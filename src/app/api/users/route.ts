import { NextResponse } from "next/server";
import {
  addUser,
  getAllUser,
} from "@/service/supabase/UsersService";
import UsersValidator from "@/validator/users";
import NotFoundError from "@/exceptions/NotFoundError";
import { headers } from "next/headers";
import AuthenticationError from "@/exceptions/AuthenticationsError";

export async function POST(req: Request) {
  try {
    // Ambil body request
    const { name, username, password, email, noHandphone } = await req.json();

    // Validasi payload
    UsersValidator.validateUserPayload({
      name,
      username,
      password,
      email,
      noHandphone,
    });

    // Ambil user dari header (diset oleh middleware)
    const headersList = headers();
    const userHeader = (await headersList).get("x-user");
    if (!userHeader) {
      return NextResponse.json(
        { status: "fail", message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = JSON.parse(userHeader);
    const roleUser = decoded.role;
    console.log(roleUser);
    if (roleUser !== "SUPERADMIN") {
      throw new AuthenticationError(`Role ${roleUser} tidak bisa akses`);
    }

    // Tambahkan user baru
    const user = await addUser(name, username, password, email, noHandphone);

    if (!user) {
      throw new NotFoundError("User tidak berhasil ditambahkan");
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
        message: error.message || "Terjadi kesalahan",
      },
      { status: error.statusCode || 400 }
    );
  }
}

export async function GET() {
  const user = await getAllUser();
  return NextResponse.json(
    {
      status: "success",
      data: { user },
    },
    { status: 200 }
  );
}
