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

async function verifyUsername(username: string) {
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
      loanParticipants: {
        select: {
          id: true,
          role: true,
          created_at: true,
          loan: {
            select: {
              loan_id: true,
              status: true,
              created_at: true,
              updated_at: true,
            },
          },
        },
      },
    },
  });

  if (result.length === 0) {
    throw new NotFoundError("User Tidak ada");
  }

  return result;
}

export async function updateUserById(
  id: string,
  data: {
    name: string;
    username: string;
    password: string;
    email: string;
    noHandphone: string;
  }
) {
  try {
    await checkUserAvalible(id);
    const updatedUser = await prisma.user.update({
      where: { user_id: id },
      data,
    });

    return {
      status: "success",
      data: updatedUser,
    };
  } catch (error: any) {
    return {
      status: "error",
      message: error.message || "Failed to update user",
    };
  }
}

export async function deleteUserById(id: string) {
  try {
    await checkUserAvalible(id);
    const deleteUser = await prisma.user.delete({
      where: { user_id: id },
    });
    return deleteUser;
  } catch (error: any) {
    return {
      status: "error",
      message: error.message || "Failed to delete user",
    };
  }
}

async function checkUserAvalible(id: string) {
  const user = await prisma.user.findUnique({
    where: { user_id: id },
  });
  if (!user) {
    throw new NotFoundError("User tidak ditemukan");
  }
}

export async function getUsersById(id: string) {
  const user = await prisma.user.findUnique({
    where: { user_id: id },
  });
  if (!user) {
    throw new NotFoundError("User tidak ditemukan");
  }
  return user;
}

interface Borrower {
  name: string;
  role: string;
  user_id?: string;
}

export async function getUsersByIds(
  ids: string[],
  role: string
): Promise<Borrower[]> {
  if (!ids || ids.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { user_id: { in: ids } },
    select: {
      user_id: true,
      name: true,
    },
  });

  const usersById = users.reduce<Record<string, Borrower>>((acc, u) => {
    acc[u.user_id] = {
      name: u.name,
      role: role,
      user_id: u.user_id,
    };
    return acc;
  }, {});

  return ids.map(
    (id) => usersById[id] || { name: "Unknown", role: "INVITED", user_id: id }
  );
}
