import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import TokenManager from "@/tokenize/TokenManager";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /** =============================
   *  2) PROTECT API (pakai header)
   * ============================= */
  if (pathname.startsWith("/api")) {
    // skip auth untuk endpoint tertentu
    if (
      pathname.startsWith("/api/auth") ||
      (pathname.startsWith("/api/users") && req.method === "POST")
    ) {
      return NextResponse.next();
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { status: "fail", message: "Unauthorized - Token required" },
        { status: 401 }
      );
    }

    const apiToken = authHeader.split(" ")[1];

    try {
      const decoded = TokenManager.verifyAccessToken(apiToken);
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user", JSON.stringify(decoded));

      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    } catch (err: any) {
      return NextResponse.json(
        { status: "fail", message: err.message || "Invalid or expired token" },
        { status: 401 }
      );
    }
  }
  /** =============================
   *  1) PROTECT PAGES (pakai cookie)
   * ============================= */
  const pageToken = req.cookies.get("accessToken")?.value;

  const isAuthPage = pathname.startsWith("/auth");
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/peminjam");

  if (isProtectedPage) {
    if (!pageToken) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    try {
      jwt.verify(pageToken, process.env.ACCESS_TOKEN_KEY as string);
    } catch (e) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }
  }

  if (isAuthPage && pageToken) {
    try {
      jwt.verify(pageToken, process.env.ACCESS_TOKEN_KEY as string);
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } catch (e) {
      // token invalid → biarkan user tetap di /auth
    }
  }

  return NextResponse.next();
}

/** Matcher:
 *  - Lindungi halaman (/dashboard, /admin, /peminjam, /auth)
 *  - Jalankan juga untuk semua API (/api/:path*)
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/peminjam/:path*",
    "/auth/:path*",
    "/api/:path*",
  ],
  runtime: "nodejs",
};
