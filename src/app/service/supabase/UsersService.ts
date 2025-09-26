import { prisma } from "@/app/lib/prismaClient";
import bcrypt from "bcryptjs";
import InvariantError from "../../exceptions/InvariantError";
import NotFoundError from "../../exceptions/NotFoundError";
import AuthenticationsError from "../../exceptions/AuthenticationsError";

export async function loginUser(username: string, password: string) {
  // cari user berdasarkan username
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // cek password hash
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new AuthenticationsError("Invalid password");
  }

  // return user tanpa password
  const { password: _, ...userSafe } = user;
  return userSafe;
}

export async function registerUser(
  name: string,
  username: string,
  password: string
) {
  //check username
  await verifyUsername(username);
  
  const hashedPassword = await bcrypt.hash(password, 10);
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
