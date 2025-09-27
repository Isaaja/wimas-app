import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // Create an initial response object.
  // This is the key to fixing your error.
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          req.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          req.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // This will refresh the session and update the cookies.
  // Supabase's library will handle the cookie syncing.
  await supabase.auth.getSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect the routes. If there is no user, redirect to the login page.
  if (!user && req.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/auth", req.url);
    // You can also add a `next` query parameter to redirect the user back
    // after they log in.
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Role-based Authorization ---
  // If a user exists, you can fetch their role from the database
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const path = req.nextUrl.pathname;
    const role = profile?.role;

    if (
      path.startsWith("/admin") &&
      role !== "admin" &&
      role !== "superadmin"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    if (path.startsWith("/superadmin") && role !== "superadmin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return res;
}
