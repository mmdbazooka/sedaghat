import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.get('logged_in')?.value === 'true';

  // محافظت از صفحه داشبورد
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // محافظت از API ها
  if (request.nextUrl.pathname.startsWith('/api/customers') || 
      request.nextUrl.pathname.startsWith('/api/send-sms')) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
    }
  }

  // ریدایرکت صفحه اصلی به داشبورد
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}