import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import TokenManager from "@/tokenize/TokenManager";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    // skip auth untuk endpoint tertentu
    if (
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/storage")
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
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch (err: any) {
      return NextResponse.json(
        { status: "fail", message: err.message || "Invalid or expired token" },
        { status: 401 }
      );
    }
  }

  const pageToken =
    req.cookies.get("accessToken")?.value || req.headers.get("x-access-token");
  const isAuthPage = pathname.startsWith("/auth");
  const isProtectedPage =
    pathname.startsWith("/superadmin") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/peminjam");

  if (isProtectedPage && !pageToken) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  if (pageToken) {
    try {
      const decoded = TokenManager.verifyAccessToken(pageToken);

      let userRole = decoded.role;

      if (!userRole) {
        throw new Error("Role not found in token");
      }

      userRole = userRole.toLowerCase();

      if (userRole === "borrower") userRole = "peminjam";

      const rolePath = `/${userRole}`;
      const targetDashboard = `${rolePath}/dashboard`;

      if (isAuthPage) {
        return NextResponse.redirect(new URL(targetDashboard, req.url));
      }

      const currentRouteMatchesRole = pathname.startsWith(rolePath);
      if (!currentRouteMatchesRole) {
        return NextResponse.redirect(new URL(targetDashboard, req.url));
      }
    } catch (e: any) {
      console.error("❌ Token verification error:", e.message);

      if (isProtectedPage) {
        const response = NextResponse.redirect(new URL("/auth", req.url));
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
      }
    }
  }

  if (pathname === "/") {
    if (pageToken) {
      try {
        const decoded = TokenManager.verifyAccessToken(pageToken);
        let userRole = decoded.role;

        if (!userRole) {
          throw new Error("Role not found in token");
        }

        userRole = userRole.toLowerCase();
        if (userRole === "borrower") userRole = "peminjam";

        const rolePath = `/${userRole}`;
        return NextResponse.redirect(new URL(rolePath + "/dashboard", req.url));
      } catch (e: any) {
        console.error("❌ Root path token error:", e.message);
        const response = NextResponse.redirect(new URL("/auth", req.url));
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        return response;
      }
    } else {
      return NextResponse.redirect(new URL("/auth", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/peminjam/:path*",
    "/superadmin/:path*",
    "/auth/:path*",
    "/api/:path*",
  ],
  runtime: "nodejs",
};
