import InvariantError from "@/exceptions/InvariantError";
import { prisma } from "@/lib/prismaClient";
import { nanoid } from "nanoid";

export async function addRefreshToken(token: string, userId: string) {
  const refreshToken = await prisma.authentication.create({
    data: {
      id: `auth-${nanoid(16)}`,
      token,
      user: {
        connect: { user_id: userId },
      },
    },
  });

  return refreshToken;
}

export async function verifyRefreshToken(token: string) {
  const verifyRefreshToken = await prisma.authentication.findUnique({
    where: {
      token,
    },
  });

  if (!verifyRefreshToken) {
    throw new InvariantError("Refresh token tidak valid");
  }

  return verifyRefreshToken;
}

export async function deleteRefreshToken(token: string) {
  await prisma.authentication.delete({
    where: { token },
  });
}
