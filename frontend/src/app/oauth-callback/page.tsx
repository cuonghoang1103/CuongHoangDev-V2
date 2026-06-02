'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * OAuth callback page — NextAuth redirects here after OAuth sign-in.
 *
 * We wait for the session to be fully loaded before deciding where to
 * redirect. If the session is still loading, we just show a spinner.
 * Once loaded, we check the role from the JWT token (set by jwt callback):
 * - ADMIN  → /admin
 * - others  → /
 */
export default function OAuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get('redirect');

  useEffect(() => {
    // Don't redirect while session is still loading
    if (status === 'loading') return;

    // Unauthenticated — redirect to login
    if (status === 'unauthenticated' || !session?.user) {
      router.replace('/login');
      return;
    }

    const role = (session.user.role as string || '').replace('ROLE_', '').toUpperCase();

    if (role === 'ADMIN') {
      router.replace('/admin');
    } else {
      router.replace(redirectParam || '/');
    }
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
