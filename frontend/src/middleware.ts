import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('backend_token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token by calling backend /profile
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/profile`, {
        headers: { Authorization: `Bearer ${token}` },
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
      // Backend unreachable — allow through but API calls will fail gracefully
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
