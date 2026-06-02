import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const backendToken = request.cookies.get('backend_token')?.value;

    // ── Case 1: Credentials user (has backend_token) ──
    if (backendToken) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/profile`, {
          headers: { Authorization: `Bearer ${backendToken}` },
          cache: 'no-store',
        });

        if (!res.ok) {
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('redirect', pathname);
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete('backend_token');
          return response;
        }

        const data = await res.json();
        const roles: string[] = data.data?.roles || [];
        const isAdmin = roles.some(
          (r: string) => r.replace('ROLE_', '').toUpperCase() === 'ADMIN'
        );

        if (!isAdmin) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch {
        // Backend unreachable — allow through; API calls will fail gracefully
      }
      return NextResponse.next();
    }

    // ── Case 2: OAuth user (NextAuth session) ──
    const nextauthToken = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    });

    if (!nextauthToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role: string = (nextauthToken.role as string) ?? 'USER';
    const isAdmin = role.replace('ROLE_', '').toUpperCase() === 'ADMIN';

    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
