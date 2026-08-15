import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export type Session = {
  userId: number;
  role: string;
};

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required');
}

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET
);

// ----------------------------------------
// Password
// ----------------------------------------

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
) {
  return bcrypt.compare(password, hash);
}

// ----------------------------------------
// Session validation
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

export async function isValidSessionToken(
  token: string
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(
      token,
      secret,
      {
        clockTolerance: 60,
      }
    );

    if (
      typeof payload.userId !== 'number' ||
      typeof payload.role !== 'string'
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
  const token = await new SignJWT({
    userId,
    role,
  })
    .setProtectedHeader({
      alg: 'HS256',
    })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

// ----------------------------------------
// Get current session
// ----------------------------------------

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      secret,
      {
        clockTolerance: 60,
      }
    );

    if (
      typeof payload.userId !== 'number' ||
      typeof payload.role !== 'string'
    ) {
      return null;
    }

    const valid = await isValidSession(
      payload.userId,
      payload.role
    );

    if (!valid) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

// ----------------------------------------
// Require authentication
// ----------------------------------------

export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

// ----------------------------------------
// Require admin
// ----------------------------------------

export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();

  if (session.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }

  return session;
}

// ----------------------------------------
// Logout
// ----------------------------------------

export async function logoutAction() {
  const cookieStore = await cookies();

  cookieStore.delete('session');

  return {
    success: true,
  };
}
