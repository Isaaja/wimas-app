import { NextResponse } from "next/server";
import { loginUser } from "@/app/service/supabase/AuthenticationsService";
import AuthenticationsValidator from "@/app/validator/authentications";
export async function POST(req: Request) {
  const { username, password } = await req.json();
  try {
    AuthenticationsValidator.validatePostAuthenticationPayload(req);
    const user = await loginUser(username, password);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json(
      { status: "fail", message: error.message },
      { status }
    );
  }
}
