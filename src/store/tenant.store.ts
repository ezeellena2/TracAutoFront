import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrganizationTheme } from '@/shared/types';
import { demoOrganizations } from '@/config/organizations.demo';

interface TenantState {
  currentOrganization: OrganizationTheme | null;
  availableOrganizations: OrganizationTheme[];
  
  // Actions
  setOrganization: (org: OrganizationTheme) => void;
  clearOrganization: () => void;
  loadDemoOrganizations: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentOrganization: null,
      availableOrganizations: demoOrganizations,

      setOrganization: (org) => set({ currentOrganization: org }),

      clearOrganization: () => set({ currentOrganization: null }),

      loadDemoOrganizations: () => set({ availableOrganizations: demoOrganizations }),
    }),
    {
      name: 'tracauto-tenant',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
      }),
    }
  )
);
