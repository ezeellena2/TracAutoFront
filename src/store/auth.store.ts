import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '@/shared/types';

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  organizationId: string | null;
  
  // Actions
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  setOrganizationId: (orgId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      organizationId: null,

      login: (user, token) => set({
        isAuthenticated: true,
        user,
        token,
        organizationId: user.organizationId,
      }),

      logout: () => set({
        isAuthenticated: false,
        user: null,
        token: null,
        organizationId: null,
      }),

      setOrganizationId: (orgId) => set({ organizationId: orgId }),
    }),
    {
      name: 'tracauto-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        organizationId: state.organizationId,
      }),
    }
  )
);
