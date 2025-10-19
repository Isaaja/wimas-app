// utils/auth.ts
import AuthenticationError from "@/exceptions/AuthenticationsError";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
interface User {
  user_id: string;
  username: string;
  name: string;
  role: string;
  email?: string;
}
interface AuthResult {
  user?: User;
  error?: NextResponse;
}
export async function checkAuth(requiredRole?: string) {
  const headersList = headers();
  const userHeader = (await headersList).get("x-user");

  if (!userHeader) {
    throw new AuthenticationError("Unauthorized");
  }

  const decoded = JSON.parse(userHeader);
  const roleUser = decoded.role;

  if (requiredRole && roleUser !== requiredRole) {
    throw new AuthenticationError(`Role ${roleUser} tidak bisa akses`);
  }

  return decoded;
}
export async function authenticate(): Promise<AuthResult> {
  try {
    const token = await checkAuth();

    if (!token) {
      return {
        error: NextResponse.json(
          { status: "fail", message: "Unauthorized - Token required" },
          { status: 401 }
        ),
      };
    }

    const user: User = {
      user_id: token.user_id,
      username: token.username,
      name: token.name,
      role: token.role,
      email: token.email,
    };

    return { user };
  } catch (error: any) {
    return {
      error: NextResponse.json(
        {
          status: "fail",
          message: "Token verification failed",
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 401 }
      ),
    };
  }
}
