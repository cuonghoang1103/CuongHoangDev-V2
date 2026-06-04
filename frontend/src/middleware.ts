import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082';
const isDebug = process.env.NODE_ENV !== 'production';

function debugLog(...args: unknown[]) {
  if (isDebug) console.log('[middleware]', ...args);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  debugLog('pathname:', pathname);

  if (pathname.startsWith('/admin')) {
    const backendToken = request.cookies.get('backend_token')?.value;
    debugLog('backendToken:', backendToken ? 'present' : 'MISSING');

    // ── Case 1: Credentials user (has backend_token) ──
    if (backendToken) {
      try {
        debugLog('verifying backend_token via /api/v1/profile');
        const res = await fetch(`/api/v1/profile`, {
          headers: { Authorization: `Bearer ${backendToken}` },
          credentials: 'include',
          cache: 'no-store',
        });
        debugLog('profile res.status:', res.status);

        if (!res.ok) {
          debugLog('profile check failed, redirect to /login');
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
        debugLog('isAdmin:', isAdmin);

        if (!isAdmin) {
          debugLog('not admin, redirect to /');
          return NextResponse.redirect(new URL('/', request.url));
        }
      } catch (e) {
        debugLog('fetch error:', e);
        // Backend unreachable — allow through; API calls will fail gracefully
      }
      return NextResponse.next();
    }

    // ── Case 2: OAuth user (NextAuth session) ──
    const nextauthToken = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    });
    debugLog('nextauthToken:', nextauthToken ? 'present' : 'MISSING');

    if (!nextauthToken) {
      debugLog('no session, redirect to /login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── OAuth + has backend_token: ALWAYS verify role from backend (not cached NextAuth JWT) ──
    if (backendToken) {
      debugLog('OAuth user has backend_token — fetching FRESH profile from backend');
      try {
        const res = await fetch(`/api/v1/profile`, {
          headers: { Authorization: `Bearer ${backendToken}` },
          credentials: 'include',
          cache: 'no-store',
        });
        debugLog('backend profile status:', res.status);
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
        debugLog('OAuth+backend_token fresh isAdmin:', isAdmin);
        if (isAdmin) return NextResponse.next();
        return NextResponse.redirect(new URL('/', request.url));
      } catch (e) {
        debugLog('backend fetch error:', e);
      }
      return NextResponse.next();
    }

    // ── OAuth only (no backend_token): fetch FRESH role from backend by email ──
    try {
      const email = nextauthToken.email as string;
      const res = await fetch(
        `${BACKEND_URL}/api/v1/auth/role?email=${encodeURIComponent(email)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        const freshRole = normalizeRole(data.data?.role ?? 'USER');
        const isAdmin = freshRole === 'ADMIN';
        debugLog('OAuth fresh role from backend:', freshRole, 'isAdmin:', isAdmin);
        if (isAdmin) return NextResponse.next();
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (e) {
      debugLog('OAuth role fetch failed:', e);
    }
    // Fallback: trust NextAuth JWT role if backend is unreachable
    const role: string = (nextauthToken.role as string) ?? 'USER';
    const isAdmin = role.replace('ROLE_', '').toUpperCase() === 'ADMIN';
    debugLog('OAuth fallback to NextAuth JWT role:', role, 'isAdmin:', isAdmin);
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

function normalizeRole(role: string | null | undefined): string {
  if (!role) return 'USER';
  const r = role.toUpperCase();
  if (r === 'ADMIN' || r === 'ROLE_ADMIN') return 'ADMIN';
  if (r === 'MODERATOR' || r === 'ROLE_MODERATOR') return 'MODERATOR';
  if (r === 'EDITOR' || r === 'ROLE_EDITOR') return 'EDITOR';
  return 'USER';
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
