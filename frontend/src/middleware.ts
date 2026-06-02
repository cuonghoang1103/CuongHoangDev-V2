import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';

export async function middleware(request: NextRequest) {
  const { pathname } = request.url;
  console.log('[middleware] pathname:', pathname, 'cookies:', request.cookies.getAll().map(c => c.name));

  if (pathname.startsWith('/admin')) {
    const backendToken = request.cookies.get('backend_token')?.value;
    console.log('[middleware] backendToken:', backendToken ? 'present' : 'MISSING');

    // ── Case 1: Credentials user (has backend_token) ──
    if (backendToken) {
      try {
        console.log('[middleware] verifying backend_token via /api/v1/profile');
        const res = await fetch(`${BACKEND_URL}/api/v1/profile`, {
          headers: { Authorization: `Bearer ${backendToken}` },
          cache: 'no-store',
        });
        console.log('[middleware] profile res.status:', res.status);

        if (!res.ok) {
          console.log('[middleware] profile check failed, redirect to /login');
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('redirect', pathname);
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete('backend_token');
          return response;
        }

        const data = await res.json();
        const roles: string[] = data.data?.roles || [];
        console.log('[middleware] roles:', roles);
        const isAdmin = roles.some(
          (r: string) => r.replace('ROLE_', '').toUpperCase() === 'ADMIN'
        );
        console.log('[middleware] isAdmin:', isAdmin);

        if (!isAdmin) {
          console.log('[middleware] not admin, redirect to /');
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch (e) {
        console.log('[middleware] fetch error:', e);
        // Backend unreachable — allow through; API calls will fail gracefully
      }
      return NextResponse.next();
    }

    // ── Case 2: OAuth user (NextAuth session) ──
    const nextauthToken = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    });
    console.log('[middleware] nextauthToken:', nextauthToken ? 'present' : 'MISSING');

    if (!nextauthToken) {
      console.log('[middleware] no session, redirect to /login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role: string = (nextauthToken.role as string) ?? 'USER';
    const isAdmin = role.replace('ROLE_', '').toUpperCase() === 'ADMIN';

    if (!isAdmin) {
      console.log('[middleware] not admin, redirect to /');
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
