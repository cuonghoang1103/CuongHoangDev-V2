import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthResponse } from '@/types';
import { ssrSafeStorage } from './ssrSafeStorage';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  setAuth: (auth: AuthResponse) => void;
  updateUser: (user: User) => void;
  updateProfile: (data: { username?: string; email?: string; avatarUrl?: string; bio?: string; fullName?: string }) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      isHydrated: false,

      setAuth: (auth) => {
        const userObj: User = {
          id: auth.userId,
          username: auth.username,
          email: auth.email,
          roles: auth.roles || [auth.role],
          enabled: true,
          accountNonLocked: true,
          createdAt: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('token', auth.token);
          localStorage.setItem('auth_token', auth.token);
          localStorage.setItem('user', JSON.stringify(userObj));
          // Signal ALL tabs/windows that auth changed
          window.dispatchEvent(new CustomEvent('auth-changed', { detail: { action: 'login', user: userObj, token: auth.token } }));
        }

        set({ user: userObj, token: auth.token, isAuthenticated: true, isLoading: false });
      },

      updateUser: (user) => set({ user }),

      updateProfile: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      /**
       * Logout — synchronous, no redirects.
       * 1. Clear ALL auth keys from storage
       * 2. Dispatch auth-changed event so ALL components/tabs reset
       * 3. Reset Zustand state immediately
       * Callers should handle navigation AFTER this returns.
       */
      logout: () => {
        if (typeof window === 'undefined') {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false, isHydrated: true });
          return;
        }

        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        document.cookie = '__auth__=; path=/; max-age=0';
        document.cookie = 'backend_token=; path=/; max-age=0';

        // Notify every component and every open tab
        window.dispatchEvent(new CustomEvent('auth-changed', { detail: { action: 'logout' } }));

        set({ user: null, token: null, isAuthenticated: false, isLoading: false, isHydrated: true });
      },

      setLoading: (loading) => set({ isLoading: loading }),
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
        state?.set({ isHydrated: true });
      },
    }
  )
);
