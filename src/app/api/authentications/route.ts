import { NextResponse } from "next/server";
import AuthenticationsValidator from "@/app/validator/authentications";
import { verifyUserCredential } from "@/app/service/supabase/UsersService";
import TokenManager from "@/app/tokenize/TokenManager";
import {
  addRefreshToken,
  deleteRefreshToken,
  verifyRefreshToken,
} from "@/app/service/supabase/AuthenticationsService";
export async function POST(req: Request) {
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
    return NextResponse.json(
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
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "fail", message: error.message },
      { status }
    );
  }
}
