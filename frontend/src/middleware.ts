/**
 * No-op locale middleware. Locale detection is handled client-side.
 * This file exists to prevent conflicts with NextAuth OAuth routes.
 */
export function middleware() {}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
