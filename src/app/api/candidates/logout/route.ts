import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });

  const cookieOptions = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };

  // Clear known auth cookies
  res.cookies.set('authToken', '', cookieOptions);
  res.cookies.set('axia_candidate_token', '', cookieOptions);
  // Clear any legacy names if present
  res.cookies.set('auth_token', '', cookieOptions);
  res.cookies.set('token', '', cookieOptions);

  return res;
}
