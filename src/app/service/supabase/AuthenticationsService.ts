import InvariantError from "@/app/exceptions/InvariantError";
import { prisma } from "@/app/lib/prismaClient";

export async function addRefreshToken(token: string, userId: number) {
  const refreshToken = await prisma.authentication.create({
    data: {
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
