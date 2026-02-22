import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrganizationTheme } from '@/shared/types';
import { OrganizacionDto, OrganizacionThemeDto, TipoOrganizacion } from '@/shared/types/api';
import { buildThemeOverride } from '@/shared/utils/buildThemeOverride';

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
  setOrganizationFromLogin: (info: {
    id: string;
    nombre: string;
    tipoOrganizacion: TipoOrganizacion;
    theme?: OrganizacionThemeDto | null;
  }) => void;
  clearOrganization: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentOrganization: null,

      setOrganization: (org) => {
        set({ currentOrganization: org });
      },

      /**
       * Convierte un OrganizacionDto del backend a OrganizationTheme
       * Maneja el caso donde theme puede no estar presente (fallback seguro)
       */
      setOrganizationFromDto: (dto) => {
        const orgTheme: OrganizationTheme = {
          id: dto.id,
          name: dto.nombre,
          logo: dto.theme?.logoUrl || '',
          tipoOrganizacion: dto.tipoOrganizacion,
          theme: buildThemeOverride(dto.theme),
        };

        set({ currentOrganization: orgTheme });
      },

      /**
       * Crea OrganizationTheme desde datos del login response (sin segunda API call)
       */
      setOrganizationFromLogin: (info) => {
        const orgTheme: OrganizationTheme = {
          id: info.id,
          name: info.nombre,
          logo: info.theme?.logoUrl || '',
          tipoOrganizacion: info.tipoOrganizacion,
          theme: buildThemeOverride(info.theme),
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
