import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'fallback-secret-change-me');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname === '/login';
  const isProtected = ['/dashboard', '/harvest', '/reports', '/admin'].some((p) =>
    pathname.startsWith(p)
  );

  let session = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
      session = payload;
    } catch {
      // invalid token
    }
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
