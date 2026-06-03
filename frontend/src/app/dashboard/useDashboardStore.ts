'use client';

/**
 * Dashboard hook using useSyncExternalStore (React 18 stable API).
 *
 * Guarantees:
 * - SSR / auth-loading: returns stable default state (never localStorage)
 * - Auth resolved: switches to correct user, loads their data from localStorage
 * - User switch (login/logout): re-renders with new user's data instantly
 * - Seeding: runs exactly once per user session
 */
import { useSyncExternalStore, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  getSnapshot,
  subscribeStore,
  switchUser,
  setActivity,
  setActivityFilter,
  addTask,
  toggleTask,
  removeTask,
  awardExp,
  markCelebrated,
  planTomorrow,
  ensureScopeSeeded,
} from './store';
import type { TaskScope } from './types';

function noopSnapshot() {
  return {
    userId: 'guest',
    level: 1,
    exp: 0,
    lastCelebrationDate: null,
    tomorrowPlanLockedDate: null,
    timeline: Array.from({ length: 24 }, (_, h) => ({ hour: h })),
    activityFilter: null,
    tasks: [],
  };
}

function noopSubscribe() {
  return () => {};
}

export function useDashboardStore() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Stable userId — only changes when auth fully resolves
  const userId = !isLoading && user?.id != null ? String(user.id) : 'guest';

  // Track whether we've switched to the correct user
  const switchedRef = useRef<string>('');
  const seededRef = useRef<string>('');

  // Sync user when userId changes (runs after paint, won't double-invoke dangerously)
  useEffect(() => {
    if (switchedRef.current !== userId) {
      console.log(`[Dashboard] useEffect switch: "${switchedRef.current}" → "${userId}"`);
      switchUser(userId);
      switchedRef.current = userId;
    }
  }, [userId]);

  // Seed default tasks once per user session
  useEffect(() => {
    if (seededRef.current !== userId) {
      seededRef.current = userId;
      (['today', 'week', 'month'] as TaskScope[]).forEach((s) => ensureScopeSeeded(s));
    }
  }, [userId]);

  // useSyncExternalStore: during SSR/loading use noop (no localStorage access),
  // after hydration use real store (localStorage-backed)
  const useRealStore = !isLoading && typeof window !== 'undefined';

  const storeSnapshot = useSyncExternalStore(
    useRealStore ? subscribeStore : noopSubscribe,
    useRealStore ? getSnapshot : noopSnapshot,
    noopSnapshot // server snapshot (identical to loading snapshot)
  );

  return {
    ...storeSnapshot,
    setActivity,
    setActivityFilter,
    addTask,
    toggleTask,
    removeTask,
    awardExp,
    markCelebrated,
    planTomorrow,
    ensureScopeSeeded,
  };
}
