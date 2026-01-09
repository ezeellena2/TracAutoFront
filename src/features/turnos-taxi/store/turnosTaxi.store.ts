/**
 * Zustand store para Turnos de Taxi
 */

import { create } from 'zustand';
import type { 
  TurnoTaxiDto, 
  TurnoActivoDto, 
  GeofenceVinculoDto,
  TurnoModalState,
  TurnosFiltros,
} from '../types';

interface TurnosTaxiStore {
  // ================================
  // DATA STATE
  // ================================
  turnos: TurnoTaxiDto[];
  turnosActivos: TurnoActivoDto[];
  geofenceVinculos: GeofenceVinculoDto[];
  
  isLoading: boolean;
  isLoadingActivos: boolean;
  isLoadingGeofences: boolean;
  error: string | null;

  // Paginación
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  tamanoPagina: number;

  // ================================
  // UI STATE
  // ================================
  modal: TurnoModalState;
  filtros: TurnosFiltros;
  turnoSeleccionado: TurnoTaxiDto | null;

  // ================================
  // DATA ACTIONS
  // ================================
  setTurnos: (turnos: TurnoTaxiDto[], paginacion: { 
    paginaActual: number; 
    totalPaginas: number; 
    totalRegistros: number;
    tamanoPagina: number;
  }) => void;
  setTurnosActivos: (turnos: TurnoActivoDto[]) => void;
  setGeofenceVinculos: (vinculos: GeofenceVinculoDto[]) => void;
  
  addTurno: (turno: TurnoTaxiDto) => void;
  updateTurno: (turno: TurnoTaxiDto) => void;
  removeTurno: (id: string) => void;

  setLoading: (loading: boolean) => void;
  setLoadingActivos: (loading: boolean) => void;
  setLoadingGeofences: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // ================================
  // UI ACTIONS
  // ================================
  openCreateModal: () => void;
  openEditModal: (turno: TurnoTaxiDto) => void;
  closeModal: () => void;
  
  setFiltros: (filtros: Partial<TurnosFiltros>) => void;
  clearFiltros: () => void;
  
  setTurnoSeleccionado: (turno: TurnoTaxiDto | null) => void;
  setPagina: (pagina: number) => void;

  // ================================
  // RESET
  // ================================
  resetState: () => void;
}

const initialModal: TurnoModalState = {
  isOpen: false,
  mode: 'create',
  turno: undefined,
};

const initialFiltros: TurnosFiltros = {
  vehiculoId: undefined,
  soloActivos: true,
  buscar: undefined,
};

export const useTurnosTaxiStore = create<TurnosTaxiStore>((set) => ({
  // Initial data state
  turnos: [],
  turnosActivos: [],
  geofenceVinculos: [],
  isLoading: false,
  isLoadingActivos: false,
  isLoadingGeofences: false,
  error: null,

  // Paginación inicial
  paginaActual: 1,
  totalPaginas: 1,
  totalRegistros: 0,
  tamanoPagina: 10,

  // Initial UI state
  modal: { ...initialModal },
  filtros: { ...initialFiltros },
  turnoSeleccionado: null,

  // Data actions
  setTurnos: (turnos, paginacion) => set({ 
    turnos, 
    ...paginacion,
    isLoading: false, 
    error: null 
  }),
  
  setTurnosActivos: (turnosActivos) => set({ 
    turnosActivos, 
    isLoadingActivos: false 
  }),
  
  setGeofenceVinculos: (geofenceVinculos) => set({ 
    geofenceVinculos, 
    isLoadingGeofences: false 
  }),

  addTurno: (turno) => set((state) => ({
    turnos: [turno, ...state.turnos],
    totalRegistros: state.totalRegistros + 1,
  })),

  updateTurno: (turno) => set((state) => ({
    turnos: state.turnos.map(t => t.id === turno.id ? turno : t),
  })),

  removeTurno: (id) => set((state) => ({
    turnos: state.turnos.filter(t => t.id !== id),
    totalRegistros: Math.max(0, state.totalRegistros - 1),
  })),

  setLoading: (isLoading) => set({ isLoading }),
  setLoadingActivos: (isLoadingActivos) => set({ isLoadingActivos }),
  setLoadingGeofences: (isLoadingGeofences) => set({ isLoadingGeofences }),
  setError: (error) => set({ error, isLoading: false }),

  // UI actions
  openCreateModal: () => set({
    modal: { isOpen: true, mode: 'create', turno: undefined },
  }),

  openEditModal: (turno) => set({
    modal: { isOpen: true, mode: 'edit', turno },
  }),

  closeModal: () => set({
    modal: { ...initialModal },
  }),

  setFiltros: (filtros) => set((state) => ({
    filtros: { ...state.filtros, ...filtros },
    paginaActual: 1, // Reset a primera página al cambiar filtros
  })),

  clearFiltros: () => set({
    filtros: { ...initialFiltros },
    paginaActual: 1,
  }),

  setTurnoSeleccionado: (turnoSeleccionado) => set({ turnoSeleccionado }),
  
  setPagina: (paginaActual) => set({ paginaActual }),

  // Reset
  resetState: () => set({
    turnos: [],
    turnosActivos: [],
    geofenceVinculos: [],
    isLoading: false,
    isLoadingActivos: false,
    isLoadingGeofences: false,
    error: null,
    paginaActual: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    tamanoPagina: 10,
    modal: { ...initialModal },
    filtros: { ...initialFiltros },
    turnoSeleccionado: null,
  }),
}));
