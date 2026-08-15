import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export type Session = {
  userId: number;
  role: string;
  iat: number;
  lastSeen: number;
};

const SESSION_COOKIE = 'session';

const IDLE_TIMEOUT_SECONDS = 30 * 60; // 30 minutes
const ABSOLUTE_TIMEOUT_SECONDS = 8 * 60 * 60; // 8 hours
const CLOCK_TOLERANCE_SECONDS = 60;

if (!process.env.SESSION_SECRET) {
  throw new Error(
    'SESSION_SECRET environment variable is required'
  );
}

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET
);

// ----------------------------------------
// Password
// ----------------------------------------

export async function hashPassword(
  password: string
) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
) {
  return bcrypt.compare(password, hash);
}

// ----------------------------------------
// Database session validation
// ----------------------------------------

export async function isValidSession(
  userId: number,
  role: string
): Promise<boolean> {
  const prisma = await import('@/lib/prisma').then(
    (module) => module.default ?? module.prisma
  );

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return !!user && user.role === role;
}

// ----------------------------------------
// Token validation
// ----------------------------------------

export async function isValidSessionToken(
  token: string
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(
      token,
      secret,
      {
        clockTolerance:
          CLOCK_TOLERANCE_SECONDS,
      }
    );

    if (
      typeof payload.userId !== 'number' ||
      typeof payload.role !== 'string'
    ) {
      return false;
    }

    const now = Math.floor(
      Date.now() / 1000
    );

    const issuedAt =
      typeof payload.iat === 'number'
        ? payload.iat
        : 0;

    const lastSeen =
      typeof payload.lastSeen === 'number'
        ? payload.lastSeen
        : 0;

    if (!issuedAt || !lastSeen) {
      return false;
    }

    // Absolute timeout
    if (
      now - issuedAt >
      ABSOLUTE_TIMEOUT_SECONDS
    ) {
      return false;
    }

    // Idle timeout
    if (
      now - lastSeen >
      IDLE_TIMEOUT_SECONDS
    ) {
      return false;
    }

    return await isValidSession(
      payload.userId,
      payload.role
    );
  } catch {
    return false;
  }
}

// ----------------------------------------
// Create session
// ----------------------------------------

export async function createSession(
  userId: number,
  role: string
) {
  const now = Math.floor(
    Date.now() / 1000
  );

  const token = await new SignJWT({
    userId,
    role,
    lastSeen: now,
  })
    .setProtectedHeader({
      alg: 'HS256',
    })
    .setIssuedAt(now)
    .setExpirationTime(
      now + ABSOLUTE_TIMEOUT_SECONDS
    )
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        'production',
      sameSite: 'lax',
      maxAge:
        ABSOLUTE_TIMEOUT_SECONDS,
      path: '/',
    }
  );
}

// ----------------------------------------
// Get current session
// ----------------------------------------

export async function getSession(): Promise<
  Session | null
> {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE
    )?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } =
      await jwtVerify(
        token,
        secret,
        {
          clockTolerance:
            CLOCK_TOLERANCE_SECONDS,
        }
      );

    if (
      typeof payload.userId !==
        'number' ||
      typeof payload.role !==
        'string'
    ) {
      return null;
    }

    const now = Math.floor(
      Date.now() / 1000
    );

    const issuedAt =
      typeof payload.iat === 'number'
        ? payload.iat
        : 0;

    const lastSeen =
      typeof payload.lastSeen === 'number'
        ? payload.lastSeen
        : 0;

    if (!issuedAt || !lastSeen) {
      return null;
    }

    // Absolute timeout
    if (
      now - issuedAt >
      ABSOLUTE_TIMEOUT_SECONDS
    ) {
      await logoutAction();
      return null;
    }

    // Idle timeout
    if (
      now - lastSeen >
      IDLE_TIMEOUT_SECONDS
    ) {
      await logoutAction();
      return null;
    }

    const valid =
      await isValidSession(
        payload.userId,
        payload.role
      );

    if (!valid) {
      return null;
    }

    return {
      userId:
        payload.userId,
      role:
        payload.role,
      iat:
        issuedAt,
      lastSeen:
        lastSeen,
    };
  } catch {
    return null;
  }
}

// ----------------------------------------
// Refresh activity timestamp
// ----------------------------------------

export async function refreshSession(
  session: Session
) {
  const now = Math.floor(
    Date.now() / 1000
  );

  const token =
    await new SignJWT({
      userId:
        session.userId,
      role:
        session.role,
      lastSeen:
        now,
    })
      .setProtectedHeader({
        alg: 'HS256',
      })
      .setIssuedAt(
        session.iat
      )
      .setExpirationTime(
        session.iat +
          ABSOLUTE_TIMEOUT_SECONDS
      )
      .sign(secret);

  const cookieStore =
    await cookies();

  const remainingLifetime =
    Math.max(
      0,
      session.iat +
        ABSOLUTE_TIMEOUT_SECONDS -
        now
    );

  cookieStore.set(
    SESSION_COOKIE,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        'production',
      sameSite: 'lax',
      maxAge:
        remainingLifetime,
      path: '/',
    }
  );
}

// ----------------------------------------
// Require authentication
// ----------------------------------------

export async function requireAuth(): Promise<Session> {
  const session =
    await getSession();

  if (!session) {
    throw new Error(
      'Unauthorized'
    );
  }

  return session;
}

// ----------------------------------------
// Require admin
// ----------------------------------------

export async function requireAdmin(): Promise<Session> {
  const session =
    await requireAuth();

  if (
    session.role !== 'ADMIN'
  ) {
    throw new Error(
      'Forbidden'
    );
  }

  return session;
}

// ----------------------------------------
// Logout
// ----------------------------------------

export async function logoutAction() {
  const cookieStore =
    await cookies();

  cookieStore.delete(
    SESSION_COOKIE
  );

  return {
    success: true,
  };
}
