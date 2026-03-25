import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrganizationTheme } from '@/shared/types';
import { OrganizacionDto, OrganizacionThemeDto, ModuloSistema } from '@/shared/types/api';
import { buildThemeOverride } from '@/shared/utils/buildThemeOverride';

interface TenantState {
  /**
   * Representa solo la organización activa del contexto actual.
   * En contexto personal debe ser null.
   * No modela todos los contextos disponibles: eso vive en auth.store.
   */
  currentOrganization: OrganizationTheme | null;

  // Actions
  setOrganization: (org: OrganizationTheme) => void;
  setOrganizationFromDto: (dto: OrganizacionDto) => void;
  setOrganizationFromLogin: (info: {
    id: string;
    nombre: string;
    theme?: OrganizacionThemeDto | null;
    modulosActivos?: number[];
  }) => void;
  clearOrganization: () => void;

  // Helpers
  tieneModulo: (modulo: ModuloSistema) => boolean;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
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
          modulosActivos: dto.modulosActivos ?? [],
          theme: buildThemeOverride(dto.theme),
        };

        set({ currentOrganization: orgTheme });
      },

      /**
       * Crea OrganizationTheme desde el snapshot del contexto organizacional activo
       */
      setOrganizationFromLogin: (info) => {
        const orgTheme: OrganizationTheme = {
          id: info.id,
          name: info.nombre,
          logo: info.theme?.logoUrl || '',
          modulosActivos: info.modulosActivos ?? [],
          theme: buildThemeOverride(info.theme),
        };
        set({ currentOrganization: orgTheme });
      },

      clearOrganization: () => set({ currentOrganization: null }),

      /**
       * Verifica si la organización activa tiene un módulo habilitado
       */
      tieneModulo: (modulo: ModuloSistema) => {
        const org = get().currentOrganization;
        return org?.modulosActivos?.includes(modulo) ?? false;
      },
    }),
    {
      name: 'tracauto-tenant',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
      }),
    }
  )
);
