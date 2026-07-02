import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (
    username === process.env.PANEL_USERNAME &&
    password === process.env.PANEL_PASSWORD
  ) {
    // ست کردن یک کوکی ساده session (بدون token)
    const response = NextResponse.json({ success: true });
    response.cookies.set('logged_in', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 168, // 7 روز
    });
    return response;
  }

  return NextResponse.json(
    { success: false, message: 'نام کاربری یا رمز عبور اشتباه است' },
    { status: 401 }
  );
}