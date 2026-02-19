import { create } from 'zustand';

export interface SolicitudContext {
  selector: string;
  route: string;
  label: string;
  entityType?: string;
  entityId?: string;
  elementTag?: string;
  pageTitle?: string;
}

interface ModoSolicitudState {
  activo: boolean;
  selectedContext: SolicitudContext | null;

  toggle: () => void;
  activar: () => void;
  desactivar: () => void;
  setSelectedContext: (ctx: SolicitudContext | null) => void;
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
