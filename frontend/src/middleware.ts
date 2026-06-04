import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, importSync } from 'jose';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';
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

  if (pathname.startsWith('/admin')) {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const backendTokenMatch = cookieHeader.match(/(?:^|;\s*)backend_token=([^;]*)/);
    const backendToken = backendTokenMatch ? backendTokenMatch[1] : undefined;
    debugLog('backendToken:', backendToken ? 'present' : 'MISSING');

    if (backendToken) {
      const payload = await decodeJwt(backendToken);

      if (!payload) {
        debugLog('JWT decode failed, redirect to /login');
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('backend_token');
        return response;
      }

      debugLog('JWT decoded, sub:', payload.sub, 'roles:', payload.roles);
      const roles: string[] = payload.roles || [];
      const isAdmin = roles.some(
        (r: string) => r.replace('ROLE_', '').toUpperCase() === 'ADMIN'
      );
      debugLog('isAdmin:', isAdmin);

      if (!isAdmin) {
        debugLog('not admin, redirect to /');
        return NextResponse.redirect(new URL('/', request.url));
      }

      return NextResponse.next();
    }

    const nextauthToken = await getTokenFromRequest(request);
    if (!nextauthToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const backendToken2 = cookieHeader.match(/(?:^|;\s*)backend_token=([^;]*)/)?.[1];
    if (backendToken2) {
      const payload = await decodeJwt(backendToken2);
      if (payload) {
        const roles: string[] = payload.roles || [];
        const isAdmin = roles.some(
          (r: string) => r.replace('ROLE_', '').toUpperCase() === 'ADMIN'
        );
        if (isAdmin) return NextResponse.next();
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    const role: string = (nextauthToken.role as string) ?? 'USER';
    const isAdmin = role.replace('ROLE_', '').toUpperCase() === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

async function getTokenFromRequest(request: NextRequest) {
  try {
    const { getToken } = await import('next-auth/jwt');
    return await getToken({
      req: request,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    });
  } catch {
    return null;
  }
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
