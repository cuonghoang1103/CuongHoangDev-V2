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

function getTokenFromRequest(req: NextRequest): string | undefined {
  // Priority 1: Authorization header (for client-side token from localStorage)
  const authHeader = req.headers.get('authorization') ?? '';
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch?.[1]) {
    return bearerMatch[1];
  }

  // Priority 2: backend_token cookie (set by /api/auth/login)
  const cookieHeader = req.headers.get('cookie') ?? '';
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)backend_token=([^;]*)/);
  if (cookieMatch?.[1]) {
    return cookieMatch[1];
  }

  return undefined;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  debugLog('pathname:', pathname);

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(request);

  if (!token) {
    debugLog('No token found — redirect to /login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await decodeJwt(token);

  if (!payload) {
    debugLog('JWT decode failed — clear cookie and redirect to /login');
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
  debugLog('sub:', payload.sub, 'roles:', roles, 'isAdmin:', isAdmin);

  if (isAdmin) {
    return NextResponse.next();
  }

  debugLog('Valid token but not admin — redirect to /');
  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
