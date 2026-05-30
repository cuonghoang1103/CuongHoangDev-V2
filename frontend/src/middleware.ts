import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isValidAuthToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const parsed = JSON.parse(decodeURIComponent(token));
    return !!(parsed?.token && parsed.token.length > 10);
  } catch {
    return token.length > 10;
  }
}

function isSafeRedirect(path: string): boolean {
  if (!path || path.startsWith('/_next') || path.startsWith('/api')) return false;
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = pathname.startsWith('/admin');

  // Truly public routes — always accessible
  const isPublicPath =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/forgot-password') ||
    pathname === '/reset-password' ||
    pathname === '/shop' ||
    pathname.startsWith('/shop/') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/academy') ||
    pathname.startsWith('/music') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/games') ||
    pathname.startsWith('/games/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico';

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check backend auth cookie (__auth__)
  const authToken = request.cookies.get('__auth__');
  const isBackendAuth = isValidAuthToken(authToken?.value);

  // Check NextAuth session cookie (for social login: github, google, facebook)
  const nextAuthSession = request.cookies.get('next-auth.session-token')?.value ||
                          request.cookies.get('__Secure-next-auth.session-token')?.value;
  const isSocialAuth = !!nextAuthSession;

  // User is authenticated if either backend auth OR social auth is present
  const isAuthenticated = isBackendAuth || isSocialAuth;

  // Not authenticated — protect this route
  if (!isAuthenticated) {
    const redirectUrl = new URL('/login', request.url);
    const rawRedirect = request.nextUrl.searchParams.get('redirect');
    if (rawRedirect && isSafeRedirect(rawRedirect)) {
      redirectUrl.searchParams.set('redirect', rawRedirect);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Admin-only routes
  if (isAdminPath) {
    // Only backend auth users have roles; social login users don't have admin roles
    if (isSocialAuth && !isBackendAuth) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    try {
      const parsed = JSON.parse(decodeURIComponent(authToken!.value));
      const roles = parsed?.roles || [];
      const isAdmin = roles.some(
        (r: string) =>
          (r || '').replace('ROLE_', '').toUpperCase() === 'ADMIN'
      );
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fonts|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
