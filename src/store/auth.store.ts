import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '@/shared/types';

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  personaId: string | null;
  /**
   * Alias del contexto organizacional activo.
   * Se mantiene por compatibilidad mientras terminamos de migrar consumers legacy
   * a `user?.organizationId` o `user?.contextoActivo`.
   */
  organizationId: string | null;

  // Actions
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  /**
   * Actualiza solo el access token sin tocar el usuario/organización.
   * Se usa para el refresh automático del interceptor.
   */
  setToken: (token: string | null) => void;
  setOrganizationId: (orgId: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      personaId: null,
      organizationId: null,

      login: (user, token) => set({
        isAuthenticated: true,
        user,
        token,
        personaId: user.personaId ?? null,
        organizationId: user.organizationId ?? null,
      }),

      logout: () => set({
        isAuthenticated: false,
        user: null,
        token: null,
        personaId: null,
        organizationId: null,
      }),

      setToken: (token) => set({ token }),

      setOrganizationId: (orgId) => set({ organizationId: orgId }),
    }),
    {
      name: 'tracauto-auth',
      // OWASP Token Storage Best Practices:
      // El access token (JWT) NO se persiste en localStorage para prevenir robo via XSS.
      // Tras F5, el interceptor llama automáticamente a /auth/refresh usando la cookie HttpOnly.
      // Solo se persisten: estado autenticado, user y contexto organizacional activo.
      // El token vive exclusivamente en memoria.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        // token: EXCLUIDO — no persistir en localStorage (XSS risk)
        personaId: state.personaId,
        organizationId: state.organizationId,
      }),
    }
  )
);
