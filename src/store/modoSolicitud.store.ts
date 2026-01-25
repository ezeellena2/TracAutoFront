import { create } from 'zustand';

export interface CrKeyContext {
  crKey: string;
  route: string;
  label: string;
  entityType?: string;
  entityId?: string;
}

interface ModoSolicitudState {
  activo: boolean;
  selectedContext: CrKeyContext | null;

  toggle: () => void;
  activar: () => void;
  desactivar: () => void;
  setSelectedContext: (ctx: CrKeyContext | null) => void;
  clearSelection: () => void;
}

export const useModoSolicitudStore = create<ModoSolicitudState>((set) => ({
  activo: false,
  selectedContext: null,

  toggle: () => set((s) => ({ activo: !s.activo, selectedContext: s.activo ? s.selectedContext : null })),
  activar: () => set({ activo: true }),
  desactivar: () => set({ activo: false, selectedContext: null }),
  setSelectedContext: (ctx) => set({ selectedContext: ctx }),
  clearSelection: () => set({ selectedContext: null }),
}));
