import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrganizationTheme } from '@/shared/types';
import { OrganizacionDto } from '@/shared/types/api';
import { ThemeColors } from '@/shared/types/organization';

interface TenantState {
  /**
   * TracAuto (frontend) asume SINGLE-ORG por sesión:
   * - La organización activa viene del login (user.organizationId) y se carga desde backend.
   * - No existe selector ni cambio de organización en runtime.
   */
  currentOrganization: OrganizationTheme | null;
  
  // Actions
  setOrganization: (org: OrganizationTheme) => void;
  setOrganizationFromDto: (dto: OrganizacionDto) => void;
  clearOrganization: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentOrganization: null,

      setOrganization: (org) => set({ currentOrganization: org }),

      /**
       * Convierte un OrganizacionDto del backend a OrganizationTheme
       * Maneja el caso donde theme puede no estar presente (fallback seguro)
       */
      setOrganizationFromDto: (dto) => {
        const themeOverride: Partial<ThemeColors> = {
          ...(dto.theme?.primary ? { primary: dto.theme.primary } : {}),
          ...(dto.theme?.primaryDark ? { primaryDark: dto.theme.primaryDark } : {}),
          ...(dto.theme?.secondary ? { secondary: dto.theme.secondary } : {}),
          ...(dto.theme?.background ? { background: dto.theme.background } : {}),
          ...(dto.theme?.surface ? { surface: dto.theme.surface } : {}),
          ...(dto.theme?.text ? { text: dto.theme.text } : {}),
          ...(dto.theme?.textMuted ? { textMuted: dto.theme.textMuted } : {}),
          ...(dto.theme?.border ? { border: dto.theme.border } : {}),
          ...(dto.theme?.success ? { success: dto.theme.success } : {}),
          ...(dto.theme?.warning ? { warning: dto.theme.warning } : {}),
          ...(dto.theme?.error ? { error: dto.theme.error } : {}),
          ...(dto.theme?.roleAdminBg ? { roleAdminBg: dto.theme.roleAdminBg } : {}),
          ...(dto.theme?.roleAdminText ? { roleAdminText: dto.theme.roleAdminText } : {}),
          ...(dto.theme?.roleOperadorBg ? { roleOperadorBg: dto.theme.roleOperadorBg } : {}),
          ...(dto.theme?.roleOperadorText ? { roleOperadorText: dto.theme.roleOperadorText } : {}),
          ...(dto.theme?.roleAnalistaBg ? { roleAnalistaBg: dto.theme.roleAnalistaBg } : {}),
          ...(dto.theme?.roleAnalistaText ? { roleAnalistaText: dto.theme.roleAnalistaText } : {}),
        };

        const orgTheme: OrganizationTheme = {
          id: dto.id,
          name: dto.nombre,
          // El backend expone logoUrl dentro del theme (branding).
          logo: dto.theme?.logoUrl || '',
          theme: themeOverride, // Override parcial (solo tokens soportados por el frontend)
        };
        set({ currentOrganization: orgTheme });
      },

      clearOrganization: () => set({ currentOrganization: null }),
    }),
    {
      name: 'tracauto-tenant',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
      }),
    }
  )
);
