import { NextResponse } from "next/server";
import { loginUser } from "@/app/service/supabase/UsersService";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  try {
    const user = await loginUser(username, password);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}
