import { prisma } from "@/lib/prismaClient";
import bcrypt from "bcryptjs";
import InvariantError from "../../exceptions/InvariantError";
import AuthenticationsError from "@/exceptions/AuthenticationsError";
import { nanoid } from "nanoid";
import NotFoundError from "@/exceptions/NotFoundError";
export async function addUser(
  name: string,
  username: string,
  password?: string,
  email?: string,
  noHandphone?: string
) {
  //check username
  await verifyUsername(username);

  const defaultPassword =
    password && password.trim() !== "" ? password : username;

  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  const user = await prisma.user.create({
    data: {
      user_id: `user-${nanoid(16)}`,
      name,
      username,
      password: hashedPassword,
      email,
      noHandphone,
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

export async function verifyUserCredential(username: string, password: string) {
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

export async function getAllUser() {
  const result = await prisma.user.findMany({
    select: {
      user_id: true,
      username: true,
      name: true,
      role: true,
      email: true,
      noHandphone: true,
    },
  });

  if (result.length === 0) {
    throw new NotFoundError("User Tidak ada");
  }

  return result;
}
