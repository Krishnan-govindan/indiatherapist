import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // Allow login page through
  if (pathname === '/admin/login') return NextResponse.next();

  // Check cookie (set after login) or header (for API clients)
  const cookieSecret = req.cookies.get('admin_secret')?.value;
  const headerSecret = req.headers.get('x-admin-secret');
  const envSecret = process.env.ADMIN_SECRET ?? 'changeme';

  if (cookieSecret === envSecret || headerSecret === envSecret) {
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
