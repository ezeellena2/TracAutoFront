/**
 * Zustand store para Geofences
 */

import { create } from 'zustand';
import type {
  GeofenceDto,
  GeofenceModalState,
  AssignModalState,
  GeofencesFiltros,
} from '../types';

interface GeofencesStore {
  // ================================
  // DATA STATE
  // ================================
  geofences: GeofenceDto[];
  isLoading: boolean;
  error: string | null;

  // ================================
  // UI STATE
  // ================================
  modal: GeofenceModalState;
  assignModal: AssignModalState;
  filtros: GeofencesFiltros;
  geofenceSeleccionada: GeofenceDto | null;

  // ================================
  // DATA ACTIONS
  // ================================
  setGeofences: (geofences: GeofenceDto[]) => void;
  addGeofence: (geofence: GeofenceDto) => void;
  updateGeofence: (geofence: GeofenceDto) => void;
  removeGeofence: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // ================================
  // UI ACTIONS
  // ================================
  openCreateModal: () => void;
  openEditModal: (geofence: GeofenceDto) => void;
  closeModal: () => void;
  openAssignModal: (geofence: GeofenceDto) => void;
  closeAssignModal: () => void;
  setFiltros: (filtros: Partial<GeofencesFiltros>) => void;
  clearFiltros: () => void;
  setGeofenceSeleccionada: (geofence: GeofenceDto | null) => void;

  // ================================
  // RESET
  // ================================
  resetState: () => void;
}

const initialModal: GeofenceModalState = {
  isOpen: false,
  mode: 'create',
  geofence: undefined,
};

const initialAssignModal: AssignModalState = {
  isOpen: false,
  geofence: undefined,
};

const initialFiltros: GeofencesFiltros = {
  soloActivas: true,
  buscar: undefined,
};

export const useGeofencesStore = create<GeofencesStore>((set) => ({
  // Initial data state
  geofences: [],
  isLoading: false,
  error: null,

  // Initial UI state
  modal: { ...initialModal },
  assignModal: { ...initialAssignModal },
  filtros: { ...initialFiltros },
  geofenceSeleccionada: null,

  // Data actions
  setGeofences: (geofences) => set({
    geofences,
    isLoading: false,
    error: null,
  }),

  addGeofence: (geofence) => set((state) => ({
    geofences: [geofence, ...state.geofences],
  })),

  updateGeofence: (geofence) => set((state) => ({
    geofences: state.geofences.map((g) => (g.id === geofence.id ? geofence : g)),
  })),

  removeGeofence: (id) => set((state) => ({
    geofences: state.geofences.filter((g) => g.id !== id),
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  // UI actions
  openCreateModal: () => set({
    modal: { isOpen: true, mode: 'create', geofence: undefined },
  }),

  openEditModal: (geofence) => set({
    modal: { isOpen: true, mode: 'edit', geofence },
  }),

  closeModal: () => set({
    modal: { ...initialModal },
  }),

  openAssignModal: (geofence) => set({
    assignModal: { isOpen: true, geofence },
  }),

  closeAssignModal: () => set({
    assignModal: { ...initialAssignModal },
  }),

  setFiltros: (filtros) => set((state) => ({
    filtros: { ...state.filtros, ...filtros },
  })),

  clearFiltros: () => set({
    filtros: { ...initialFiltros },
  }),

  setGeofenceSeleccionada: (geofenceSeleccionada) => set({ geofenceSeleccionada }),

  // Reset
  resetState: () => set({
    geofences: [],
    isLoading: false,
    error: null,
    modal: { ...initialModal },
    assignModal: { ...initialAssignModal },
    filtros: { ...initialFiltros },
    geofenceSeleccionada: null,
  }),
}));
