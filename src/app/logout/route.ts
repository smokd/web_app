import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

const SESSION_COOKIE = 'session';

export async function GET() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);

  redirect('/login');
}
