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

      setOrganization: (org) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bb1a61ab-ff73-446c-aa2c-a9a0be282dee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tenant.store.ts:26',message:'[HYP-A] setOrganization llamado',data:{orgId:org.id,orgName:org.name,tipoOrganizacion:org.tipoOrganizacion,tipoOrgDefinido:!!org.tipoOrganizacion},timestamp:Date.now(),sessionId:'debug-marketplace',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        set({ currentOrganization: org });
      },

      /**
       * Convierte un OrganizacionDto del backend a OrganizationTheme
       * Maneja el caso donde theme puede no estar presente (fallback seguro)
       */
      setOrganizationFromDto: (dto) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bb1a61ab-ff73-446c-aa2c-a9a0be282dee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tenant.store.ts:32',message:'[HYP-A] setOrganizationFromDto llamado',data:{dtoId:dto.id,dtoNombre:dto.nombre,tipoOrganizacion:dto.tipoOrganizacion,tipoOrgDefinido:!!dto.tipoOrganizacion},timestamp:Date.now(),sessionId:'debug-marketplace',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

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
          tipoOrganizacion: dto.tipoOrganizacion,
          theme: themeOverride, // Override parcial (solo tokens soportados por el frontend)
        };

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bb1a61ab-ff73-446c-aa2c-a9a0be282dee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tenant.store.ts:60',message:'[HYP-A] setOrganizationFromDto - orgTheme creado',data:{orgThemeId:orgTheme.id,orgThemeName:orgTheme.name,tipoOrganizacion:orgTheme.tipoOrganizacion,tipoOrgDefinido:!!orgTheme.tipoOrganizacion},timestamp:Date.now(),sessionId:'debug-marketplace',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        set({ currentOrganization: orgTheme });

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/bb1a61ab-ff73-446c-aa2c-a9a0be282dee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tenant.store.ts:64',message:'[HYP-B] Después de set - verificar persistencia',data:{},timestamp:Date.now(),sessionId:'debug-marketplace',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
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
