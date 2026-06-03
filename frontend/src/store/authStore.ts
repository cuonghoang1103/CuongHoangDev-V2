import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthResponse } from '@/types';
import { ssrSafeStorage } from './ssrSafeStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (auth: AuthResponse) => void;
  updateUser: (user: User) => void;
  updateProfile: (data: { username?: string; email?: string; avatarUrl?: string; bio?: string; fullName?: string }) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (auth) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', auth.token);
          localStorage.setItem('auth_token', auth.token); // for shop.ts compatibility
          localStorage.setItem('user', JSON.stringify({
            id: auth.userId,
            username: auth.username,
            email: auth.email,
            roles: auth.roles || [auth.role],
            enabled: true,
            accountNonLocked: true,
            createdAt: new Date().toISOString(),
          }));
        }
        set({
          user: {
            id: auth.userId,
            username: auth.username,
            email: auth.email,
            roles: auth.roles || [auth.role],
            enabled: true,
            accountNonLocked: true,
            createdAt: new Date().toISOString(),
          },
          token: auth.token,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      updateUser: (user) =>
        set({ user }),

      updateProfile: (data: { username?: string; email?: string; avatarUrl?: string; bio?: string; fullName?: string }) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      logout: () => {
        if (typeof window === 'undefined') {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          return;
        }

        // 1. Clear auth tokens & user data
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        document.cookie = '__auth__=; path=/; max-age=0';
        document.cookie = 'backend_token=; path=/; max-age=0';

        // 2. Clear dashboard state (direct localStorage — each user has their own key)
        //    Dashboard store uses keys like "123_dashboard", "guest_dashboard"
        //    We only need to clear the CURRENT user's key.
        //    The safest approach: reload so the new user starts fresh.
        window.location.href = '/dashboard';

        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      },

      setLoading: (loading) =>
        set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);
