import { prisma } from "@/app/lib/prismaClient";
import bcrypt from "bcryptjs";
import InvariantError from "../../exceptions/InvariantError";
import AuthenticationsError from "@/app/exceptions/AuthenticationsError";
import { nanoid } from "nanoid";
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
