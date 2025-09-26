import { prisma } from "@/app/lib/prismaClient";
import bcrypt from "bcryptjs";
import InvariantError from "../../exceptions/InvariantError";

export async function registerUser(
  name: string,
  username: string,
  password?: string
) {
  //check username
  await verifyUsername(username);

  const defaultPassword =
    password && password.trim() !== "" ? password : username;

  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  const user = await prisma.user.create({
    data: {
      name,
      username,
      password: hashedPassword,
    },
  });

  const { password: _, ...userSafe } = user;
  return userSafe;
}

export async function verifyUsername(username: string) {
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    throw new InvariantError(
      "Gagal menambahkan user. Username sudah digunakan."
    );
  }
}
