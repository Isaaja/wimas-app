// utils/auth.ts
import { headers } from "next/headers";

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
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
