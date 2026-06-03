'use client';

/**
 * Dashboard Zustand store + user sync hook.
 *
 * page.tsx imports useDashboardStore from here to get the Zustand hook.
 * useUserDashboard() wires auth userId to the store's switchUser() action.
 */
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStoreBase } from './store';

export const useDashboardStore = useDashboardStoreBase;

export function useUserDashboard() {
  const user = useAuthStore((s) => s.user);
  const store = useDashboardStore;
  const userId = user?.id != null ? String(user.id) : 'guest';
  const prevRef = useRef<string>(userId);

  useEffect(() => {
    if (prevRef.current !== userId) {
      console.log(`[Dashboard] User switch: "${prevRef.current}" → "${userId}"`);
      store.getState().switchUser(userId);
      prevRef.current = userId;
    }
  }, [userId, store]);

  return store;
}
