import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import TokenManager from "./tokenize/TokenManager";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/users")) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized - Token required" },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = TokenManager.verifyAccessToken(token);
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user", JSON.stringify(decoded));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "fail", message: err.message || "Invalid or expired token" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
  runtime: "nodejs",
};
