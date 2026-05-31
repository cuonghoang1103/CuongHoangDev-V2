/**
 * Cookie-based locale detection middleware.
 * NOTE: next-intl middleware (next-intl/middleware) is REMOVED because it
 * conflicts with NextAuth OAuth routes. OAuth callback URLs like
 * /api/auth/callback/google get intercepted by next-intl middleware,
 * breaking the OAuth flow entirely.
 *
 * All locale detection is handled client-side via the useTranslation hook
 * and LocaleContext, which read/write the 'locale' cookie directly.
 */
export function middleware() {
  // No-op: locale detection is handled client-side.
  // This middleware exists to prevent next-intl/middleware from
  // intercepting NextAuth OAuth routes.
}

export const config = {
  // Don't match anything — this middleware is a no-op
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
