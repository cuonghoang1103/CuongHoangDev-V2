import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthResponse } from '@/types';

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
          localStorage.setItem('user', JSON.stringify({
            id: auth.userId,
            username: auth.username,
            email: auth.email,
            roles: auth.roles || [auth.role],
            enabled: true,
            accountNonLocked: true,
            createdAt: new Date().toISOString(),
          }));
          // Sync auth state to cookie so middleware can read it
          const authState = JSON.stringify({
            state: {
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
            },
            version: 0,
          });
          document.cookie = `__auth__=${encodeURIComponent(JSON.stringify({
            token: auth.token,
            username: auth.username,
            roles: auth.roles || [auth.role],
          }))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
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
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          document.cookie = '__auth__=; path=/; max-age=0';
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading) =>
        set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
