import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // Allow login page and auth API through
  if (pathname === '/admin/login') return NextResponse.next();

  // The admin_secret cookie is set by POST /api/admin-auth ONLY after
  // validating the password. If the cookie exists, the user authenticated.
  // We also support an x-admin-secret header for API clients.
  const cookieSecret = req.cookies.get('admin_secret')?.value;
  const headerSecret = req.headers.get('x-admin-secret');
  const envSecret = process.env.ADMIN_SECRET;

  const authenticated =
    (cookieSecret && cookieSecret.length > 0) ||
    (headerSecret && envSecret && headerSecret === envSecret);

  if (authenticated) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
