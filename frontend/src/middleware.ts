import { NextRequest, NextResponse } from 'next/server';

const isDebug = process.env.NODE_ENV !== 'production';

function debugLog(...args: unknown[]) {
  if (isDebug) console.log('[middleware]', ...args);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  debugLog('pathname:', pathname);

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Read admin_role cookie (set by /api/auth/login as a non-httpOnly cookie)
  // Value: "1" = admin, "0" = non-admin
  const cookieHeader = request.headers.get('cookie') ?? '';
  const adminRoleMatch = cookieHeader.match(/(?:^|;\s*)admin_role=([^;]*)/);
  const adminRole = adminRoleMatch?.[1];

  debugLog('admin_role cookie:', adminRole);

  // Check for admin
  if (adminRole === '1') {
    debugLog('Admin access granted');
    return NextResponse.next();
  }

  // No admin cookie → redirect to login
  debugLog('No admin cookie or not admin — redirect to /login');
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
