'use client';

import { Suspense, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * OAuth callback page — NextAuth redirects here after OAuth sign-in.
 *
 * After the NextAuth session is established, we:
 * 1. Wait for the session to be fully loaded
 * 2. Call /api/auth/oauth/token to set the backend_token cookie
 * 3. Redirect to /admin or /
 */
function OAuthCallbackContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get('redirect');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session?.user) {
      router.replace('/login');
      return;
    }

    const setupAndRedirect = async () => {
      try {
        // Set backend_token cookie so all backend API calls work (products, music, etc.)
        await fetch('/api/auth/oauth/token', { method: 'POST' });
      } catch (err) {
        console.error('[oauth-callback] Failed to set backend_token:', err);
      }

      const role = ((session.user.role as string) || '').replace('ROLE_', '').toUpperCase();
      if (role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace(redirectParam || '/');
      }
    };

    setupAndRedirect();
  }, [session, status, router, redirectParam]);

  return (
    <div className="min-h-screen bg-darkbg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-neon-violet animate-spin" />
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-darkbg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-neon-violet animate-spin" />
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
