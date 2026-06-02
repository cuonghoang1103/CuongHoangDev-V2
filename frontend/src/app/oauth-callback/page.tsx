'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * OAuth callback page — NextAuth redirects here after OAuth sign-in.
 * The jwt callback already set the correct role in the JWT token.
 * We call useSession().update() to re-read the session from the updated JWT,
 * then redirect based on the fresh role:
 * - ADMIN  → /admin
 * - others  → /
 */
export default function OAuthCallbackPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') {
      // Session not loaded yet — force-refresh from JWT
      update();
      return;
    }

    if (status === 'unauthenticated' || !session?.user) {
      router.replace('/login');
      return;
    }

    const role = (session.user.role as string || '').replace('ROLE_', '').toUpperCase();
    if (role === 'ADMIN') {
      router.replace('/admin');
    } else {
      router.replace('/');
    }
  }, [session, status, update, router]);

  return (
    <div className="min-h-screen bg-darkbg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-neon-violet animate-spin" />
        <p className="text-text-muted text-sm">Syncing session...</p>
      </div>
    </div>
  );
}
