import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset, PasswordResetUserType } from '@/lib/passwordReset';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const userType = body.userType as PasswordResetUserType;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (userType !== 'employer' && userType !== 'candidate') {
      return NextResponse.json({ error: 'Invalid account type.' }, { status: 400 });
    }

    const result = await requestPasswordReset(userType, email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
