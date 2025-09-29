import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  const token = req.cookies.get('accessToken')?.value;

  const isAuthPage = pathname.startsWith('/auth');
  
  const isProtectedPage = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/peminjam');

  if (isProtectedPage) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }

    try {
      jwt.verify(token, process.env.ACCESS_TOKEN_KEY as string);
    } catch (e) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }
  } else if (isAuthPage) {
    if (token) {
      try {
        jwt.verify(token, process.env.ACCESS_TOKEN_KEY as string);
        return NextResponse.redirect(new URL('/dashboard', req.url));
      } catch (e) {
        return NextResponse.next();
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/peminjam/:path*', '/auth/:path*'],
};