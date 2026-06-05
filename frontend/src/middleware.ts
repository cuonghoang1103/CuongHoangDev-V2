import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'CuongHoangDevV2SecretKeyNangCao2026NheMaNayCanItNhat256BitNhe';
const isDebug = process.env.NODE_ENV !== 'production';

function debugLog(...args: unknown[]) {
  if (isDebug) console.log('[middleware]', ...args);
}

async function decodeJwt(token: string): Promise<{ sub: string; roles?: string[] } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub: string; roles?: string[] };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  debugLog('pathname:', pathname);

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const backendTokenMatch = cookieHeader.match(/(?:^|;\s*)backend_token=([^;]*)/);
  const backendToken = backendTokenMatch ? backendTokenMatch[1] : undefined;

  // ── Case 1: Credentials user — has backend_token cookie ──
  if (backendToken) {
    debugLog('backendToken: present');

    const payload = await decodeJwt(backendToken);

    if (!payload) {
      debugLog('JWT decode failed, redirect to /login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('backend_token');
      return response;
    }

    const roles: string[] = payload.roles || [];
    const isAdmin = roles.some(
      (r: string) => r.replace('ROLE_', '').toUpperCase() === 'ADMIN'
    );
    debugLog('JWT decoded, sub:', payload.sub, 'roles:', roles, 'isAdmin:', isAdmin);

    if (isAdmin) {
      return NextResponse.next();
    }

    // Token valid but not admin → go to home
    debugLog('credentials user not admin, redirect to /');
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ── Case 2: OAuth user — NextAuth session (no backend_token) ──
  // Let through; admin layout will verify role via backend API
  // (admin layout runs in Node.js runtime where fetch+cookies work properly)
  debugLog('No backend_token — OAuth user, letting through to admin layout for verification');
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
