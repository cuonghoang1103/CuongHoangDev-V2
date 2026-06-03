'use client';

/**
 * Stable hook for the per-user dashboard store.
 *
 * Problem it solves:
 * - When userId changes (login/logout/switch account), React re-renders but the
 *   Zustand store instance stays the same unless we explicitly recreate it.
 * - useMemo(() => createDashboardStore({userId}), [userId]) recreates the
 *   store but NOT its data — it reuses the persisted state for the NEW userId.
 *   So user1's tasks would show for user2 on first load.
 *
 * Solution:
 * - Hold the current store in a useRef.
 * - When userId changes, call store.getState().reset() to clear old data,
 *   then swap in a fresh store instance for the new userId.
 * - The persist middleware automatically loads the correct data for the new userId.
 */
import { useRef, useEffect, useState } from 'react';
import { createDashboardStore } from './store';
import type { DashboardStoreHook } from './store';

export function useDashboardStore(userId: string): DashboardStoreHook {
  // Store instance — persists across re-renders until userId changes
  const storeRef = useRef<DashboardStoreHook | null>(null);

  // Track the current userId to detect changes
  const prevUserIdRef = useRef<string>(userId);
  const [hydrationKey, setHydrationKey] = useState(0);

  // When userId changes: reset old store data, then create a fresh instance
  if (storeRef.current === null || prevUserIdRef.current !== userId) {
    // Reset the existing store before swapping — prevents stale data flash
    if (storeRef.current !== null) {
      storeRef.current.getState().reset();
    }

    storeRef.current = createDashboardStore({ userId });
    prevUserIdRef.current = userId;
    // Bump key to force any components subscribed to this hook to re-read
    // from the new store instance on the same render
    setHydrationKey((k) => k + 1);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // On mount (or after hydration) seed default tasks if needed
    // The store is already created above, so storeRef.current is never null here
  }, [hydrationKey]);

  // @ts-ignore — storeRef.current is always non-null at render time
  return storeRef.current;
}
