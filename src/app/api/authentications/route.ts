import { NextResponse } from "next/server";
import AuthenticationsValidator from "@/validator/authentications";
import { verifyUserCredential } from "@/service/supabase/UsersService";
import TokenManager from "@/tokenize/TokenManager";
import {
  addRefreshToken,
  deleteRefreshToken,
  verifyRefreshToken,
} from "@/service/supabase/AuthenticationsService";
export async function POST(req: Request, res) {
  const { username, password } = await req.json();
  try {
    AuthenticationsValidator.validatePostAuthenticationPayload({
      username,
      password,
    });
    const user = await verifyUserCredential(username, password);
    const accessToken = TokenManager.generateAccessToken(user);
    const refreshToken = TokenManager.generateRefreshToken(user);
    await addRefreshToken(refreshToken, user.user_id);

    const res = NextResponse.json(
      {
        status: "success",
        message: "Authentication berhasil ditambahkan",
        data: {
          accessToken,
          refreshToken,
        },
      },
      {
        status: 201,
      }
    );
    res.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/", 
    });

    return res;
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "fail", message: error.message },
      { status }
    );
  }
}

export async function PUT(req: Request) {
  const { refreshToken } = await req.json();
  try {
    AuthenticationsValidator.validatePutAuthenticationPayload({ refreshToken });
    await verifyRefreshToken(refreshToken);

    const decoded = TokenManager.verifyRefreshToken(refreshToken);

    if (typeof decoded === "string") {
      throw new Error("Invalid token payload");
    }
    const accessToken = TokenManager.generateAccessToken(decoded);

    return NextResponse.json({
      status: "success",
      data: {
        accessToken,
      },
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "fail", message: error.message },
      { status }
    );
  }
}

export async function DELETE(req: Request) {
  const { refreshToken } = await req.json();
  try {
    AuthenticationsValidator.validateDeleteAuthenticationPayload({
      refreshToken,
    });
    await verifyRefreshToken(refreshToken);
    await deleteRefreshToken(refreshToken);

    return NextResponse.json({
      status: "success",
      message: "Berhasil menghapus token",
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "fail", message: error.message },
      { status }
    );
  }
}
