'use client';

/**
 * Wires auth userId → dashboard store.
 *
 * - Initializes localStorage state for the logged-in user on mount.
 * - Subscribes to store changes (triggers re-renders).
 * - Calls switchUser() when auth userId changes.
 *
 * Components import the store API directly:
 *   import { getState, subscribe, addTask, ... } from './store';
 */
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  getState,
  subscribe,
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

export function useDashboardStore() {
  const user = useAuthStore((s) => s.user);
  const [snapshot, setSnapshot] = useState(() => getState());
  const prevUserIdRef = useRef<string | null>(null);

  // Subscribe to store changes
  useEffect(() => {
    const unsub = subscribe(() => {
      setSnapshot(getState());
    });
    return unsub;
  }, []);

  // Initialize / switch user on mount or auth change
  useEffect(() => {
    const userId = user?.id != null ? String(user.id) : 'guest';

    if (prevUserIdRef.current === null) {
      // First mount — load from localStorage for this user
      switchUser(userId);
      prevUserIdRef.current = userId;
    } else if (prevUserIdRef.current !== userId) {
      // Auth changed — switch to the new user
      console.log(`[Dashboard] Auth changed: "${prevUserIdRef.current}" → "${userId}"`);
      switchUser(userId);
      prevUserIdRef.current = userId;
    }
  }, [user?.id]);

  // Seed default tasks after user switch
  useEffect(() => {
    (['today', 'week', 'month'] as TaskScope[]).forEach((s) => ensureScopeSeeded(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.userId]);

  return {
    ...snapshot,
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
