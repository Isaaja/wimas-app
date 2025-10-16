import { addUser, getAllUser } from "@/service/supabase/UsersService";
import UsersValidator from "@/validator/users";
import NotFoundError from "@/exceptions/NotFoundError";
import { checkAuth } from "@/app/utils/auth";
import { errorResponse, successResponse } from "@/app/utils/response";

export async function POST(req: Request) {
  try {
    await checkAuth("ADMIN");
    // Ambil body request
    const { name, username, password, email, noHandphone } = await req.json();

    UsersValidator.validateUserPayload({
      name,
      username,
      password,
      email,
      noHandphone,
    });

    const user = await addUser(name, username, password, email, noHandphone);

    if (!user) {
      throw new NotFoundError("User tidak berhasil ditambahkan");
    }
    return successResponse(user, "", 201);
  } catch (error: any) {
    return errorResponse(error, "Failed to add user");
  }
}

export async function GET() {
  const user = await getAllUser();
  return successResponse(user);
}
