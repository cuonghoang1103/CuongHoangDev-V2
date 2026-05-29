import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = pathname.startsWith('/admin');
  const isAuthPath = pathname === '/login' || pathname === '/register';
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico';

  if (isPublicPath) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get('__auth__');
  const authCookie = request.cookies.get('auth-storage');
  const isAuthenticated = !!(authToken?.value) || (!!authCookie?.value && authCookie.value.length > 10);

  if (isAdminPath) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login?redirect=' + pathname, request.url));
    }
    return NextResponse.next();
  }

  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fonts|images).*)',
  ],
};
