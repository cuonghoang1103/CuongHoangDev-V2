'use client';

import { Suspense, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * OAuth callback page — NextAuth redirects here after OAuth sign-in.
 *
 * We wait for the session to be fully loaded before deciding where to
 * redirect. Once loaded, we check the role from the JWT token:
 * - ADMIN  → /admin
 * - others  → /
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
