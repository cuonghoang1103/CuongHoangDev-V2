import { NextRequest, NextResponse } from 'next/server';

const isDebug = process.env.NODE_ENV !== 'production';

function debugLog(...args: unknown[]) {
  if (isDebug) console.log('[middleware]', ...args);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const backendTokenMatch = cookieHeader.match(/(?:^|;\s*)backend_token=([^;]*)/);
  const adminRoleMatch = cookieHeader.match(/(?:^|;\s*)admin_role=([^;]*)/);
  const backendToken = backendTokenMatch?.[1] ?? '';
  const adminRole = adminRoleMatch?.[1];

  debugLog('path:', pathname, 'admin_role:', adminRole, 'has_backend_token:', !!backendToken);

  // Quick path: if admin_role=1 AND backend_token exists, let through.
  // The admin/layout.tsx does a full server-side re-check on every render anyway.
  if (adminRole === '1' && backendToken) {
    debugLog('Admin access granted (cookie check)');
    return NextResponse.next();
  }

  // Partial state: have backend_token but no admin_role or not admin.
  // Re-verify with the server-side admin-check route that reads the httpOnly token.
  if (backendToken && adminRole !== '1') {
    try {
      const apiUrl = new URL('/api/auth/admin-check', request.url).toString();
      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Cookie': `backend_token=${backendToken}`,
          'x-middleware-request': 'admin-check',
        },
        credentials: 'include',
        // Don't use cache — always get fresh data
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const isAdmin = data?.data?.roles?.some(
          (r: string) => (r || '').replace('ROLE_', '').toUpperCase() === 'ADMIN'
        );

        if (isAdmin) {
          debugLog('Admin access granted (server re-check)');
          // Create a response and set admin_role cookie for future requests
          const response = NextResponse.next();
          response.cookies.set('admin_role', '1', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24,
            path: '/',
          });
          return response;
        }
      }
      debugLog('Server re-check failed, redirecting');
    } catch (err) {
      debugLog('Server re-check error:', err);
    }
  }

  // No valid admin access — redirect to login
  debugLog('No admin access — redirect to /login');
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
