import { useEffect } from 'react';
import { useAuthStore } from './authStore';
import { useCartStore } from './cartStore';
import { useChatStore } from './chatStore';

/**
 * Rehydrates all persisted Zustand stores after SSR hydration completes.
 *
 * Pattern: all stores use skipHydration:true so server and client both
 * render with default state (no mismatch). After mount, useEffect fires
 * rehydrate() on each store so localStorage data loads into state.
 *
 * Call this hook ONCE at the root layout level.
 */
export function useRehydrateStores() {
  useEffect(() => {
    // Rehydrate each store from localStorage after initial render
    (useAuthStore.getState() as any).persist?.rehydrate();
    (useCartStore.getState() as any).persist?.rehydrate();
    (useChatStore.getState() as any).persist?.rehydrate();
  }, []);
}
