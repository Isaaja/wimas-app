import AuthenticationsError from "../../exceptions/AuthenticationsError";
import { prisma } from "@/app/lib/prismaClient";
import bcrypt from "bcryptjs";

export async function loginUser(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new AuthenticationsError("User not found");
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new AuthenticationsError("Invalid password");
  }

  const { password: _, ...userSafe } = user;
  return userSafe;
}
