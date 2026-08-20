import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const SESSION_COOKIE = "session";

const IDLE_TIMEOUT_SECONDS = 30 * 60;
const ABSOLUTE_TIMEOUT_SECONDS = 8 * 60 * 60;
const CLOCK_TOLERANCE_SECONDS = 60;

function getSecret() {
  const value = process.env.SESSION_SECRET;

  if (!value) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  return new TextEncoder().encode(value);
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname === "/login";

  const isProtected = [
    "/dashboard",
    "/harvest",
    "/reports",
    "/admin",
    "/packhouse",
  ].some((p) => pathname.startsWith(p));

  let payload = null;

  if (token) {
    try {
      const result = await jwtVerify(token, getSecret(), {
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
      });

      payload = result.payload;

      const now = Math.floor(Date.now() / 1000);

      const issuedAt = typeof payload.iat === "number" ? payload.iat : 0;

      const lastSeen =
        typeof payload.lastSeen === "number" ? payload.lastSeen : 0;

      /*
       * Old sessions created before
       * the timeout change don't have
       * lastSeen.
       *
       * Force them to login again.
       */
      if (!issuedAt || !lastSeen) {
        payload = null;
      } else if (now - issuedAt > ABSOLUTE_TIMEOUT_SECONDS) {

      /*
       * Absolute timeout
       */
        payload = null;
      } else if (now - lastSeen > IDLE_TIMEOUT_SECONDS) {

      /*
       * Idle timeout
       */
        payload = null;
      }
    } catch {
      payload = null;
    }
  }

  /*
   * Logged-in user visiting login
   */
  if (isAuthPage && payload) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  /*
   * Protected page without
   * valid session.
   *
   * Preserve the page the user
   * originally wanted.
   */
  if (isProtected && !payload) {
    const loginUrl = new URL("/login", request.url);

    /*
     * Preserve pathname and
     * query string.
     *
     * Example:
     * /harvest
     * becomes
     * /login?returnTo=/harvest
     */
    const returnTo = request.nextUrl.pathname + request.nextUrl.search;

    loginUrl.searchParams.set("returnTo", returnTo);

    const response = NextResponse.redirect(loginUrl);

    response.cookies.delete(SESSION_COOKIE);

    return response;
  }

  /*
   * Refresh activity timestamp.
   *
   * Only refresh every 5 minutes
   * to avoid rewriting the cookie
   * on every request.
   */
  if (payload) {
    const now = Math.floor(Date.now() / 1000);

    const lastSeen = Number(payload.lastSeen);

    if (now - lastSeen >= 5 * 60) {
      const issuedAt = Number(payload.iat);

      const refreshedToken = await new SignJWT({
        userId: payload.userId,
        role: payload.role,
        lastSeen: now,
      })
        .setProtectedHeader({
          alg: "HS256",
        })
        .setIssuedAt(issuedAt)
        .setExpirationTime(issuedAt + ABSOLUTE_TIMEOUT_SECONDS)
        .sign(getSecret());

      const response = NextResponse.next();

      const remaining = Math.max(0, issuedAt + ABSOLUTE_TIMEOUT_SECONDS - now);

      response.cookies.set(SESSION_COOKIE, refreshedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: remaining,
        path: "/",
      });

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
