import { NextResponse } from "next/server";
import AuthenticationsValidator from "@/validator/authentications";
import { verifyUserCredential } from "@/service/supabase/UsersService";
import TokenManager from "@/tokenize/TokenManager";

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

    try {
      const verified = TokenManager.verifyAccessToken(accessToken);
      console.log("🔑 Immediate verification success:", verified);
    } catch (e) {
      console.error("🔑 Immediate verification FAILED:", e);
    }

    const res = NextResponse.json(
      {
        status: "success",
        message: "Authentication berhasil ditambahkan",
        data: {
          include: {
            userId: user.user_id,
            role: user.role,
            name: user.name,
          },
          accessToken,
          refreshToken,
        },
      },
      {
        status: 201,
      }
    );

    const getCookieSettings = () => {
      const isProduction = process.env.NODE_ENV === "production";
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const isHttps = apiUrl.startsWith("https://");
      const isLocalhost =
        apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1");
      const isIntranet =
        /^http:\/\/192\.168\.\d+\.\d+/.test(apiUrl) ||
        /^http:\/\/10\.\d+\.\d+\.\d+/.test(apiUrl);

      return {
        httpOnly: true,
        secure: isProduction && isHttps && !isLocalhost && !isIntranet,
        sameSite: "lax" as const,
        path: "/",
      };
    };

    // Kemudian di dalam POST function:
    const cookieSettings = getCookieSettings();

    res.cookies.set("accessToken", accessToken, {
      ...cookieSettings,
      maxAge: 60 * 60 * 10, // 10 jam
    });

    res.cookies.set("refreshToken", refreshToken, {
      ...cookieSettings,
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });
    return res;

    // ... existing code ...
  } catch (error: any) {
    console.error("🔑 Login error:", error);
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

    const res = NextResponse.json({
      status: "success",
      message: "Berhasil menghapus token",
    });

    res.cookies.delete("accessToken");
    res.cookies.delete("refreshToken");
    return res;
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "fail", message: error.message },
      { status }
    );
  }
}
