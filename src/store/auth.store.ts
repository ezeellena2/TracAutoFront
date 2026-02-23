import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '@/shared/types';

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  /**
   * Duplica user.organizationId intencionalmente.
   * 5+ archivos (organizaciones.api, invitaciones.api, SolicitudesCambioPage, etc.)
   * acceden a state.organizationId directamente. Refactorizar a user?.organizationId
   * requiere verificar disponibilidad de user tras F5 (rehidratación). Mantener como está.
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

      setToken: (token) => set({ token }),

      setOrganizationId: (orgId) => set({ organizationId: orgId }),
    }),
    {
      name: 'tracauto-auth',
      // OWASP Token Storage Best Practices:
      // El access token (JWT) NO se persiste en localStorage para prevenir robo via XSS.
      // Tras F5, el interceptor llama automáticamente a /auth/refresh usando la cookie HttpOnly.
      // Solo se persisten: isAuthenticated (para mostrar UI correcta), user (datos de perfil),
      // y organizationId (para routing). El token vive exclusivamente en memoria.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        // token: EXCLUIDO — no persistir en localStorage (XSS risk)
        organizationId: state.organizationId,
      }),
    }
  )
);
