import { create } from 'zustand';
import { VehiclePosition, MapViewport, MapStyle } from '../types';

interface LabelConfig {
  enabled: boolean;
  showImei: boolean;
  showPatente: boolean;
  showEstado: boolean;
}

// Nuevo tipo de filtro compatible
export type FilterMode = 'all' | 'own' | 'organization';

interface TraccarMapState {
  // Data
  vehicles: VehiclePosition[];
  isLoading: boolean;
  error: string | null;

  // UI State
  selectedVehicleId: string | null;
  searchText: string;
  labelConfig: LabelConfig;

  // Filtros (Refactorizado para compatibilidad BE Hall-028)
  filterMode: FilterMode;
  filterOrgName: string | null;     // Nombre de la org para filtrar (no ID)
  filterOrgId: string | null;       // ID de la org para UI (dropdown active state)

  // Geofences de turnos activos
  showGeofences: boolean;

  mapStyle: MapStyle;
  viewport: MapViewport;

  // Actions
  setVehicles: (vehicles: VehiclePosition[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedVehicle: (id: string | null) => void;
  setSearchText: (text: string) => void;
  toggleLabelField: (field: keyof Omit<LabelConfig, 'enabled'>) => void;
  setLabelConfig: (config: Partial<LabelConfig>) => void;

  // Filtros Actions
  setFilterAll: () => void;
  setFilterOwn: () => void;
  setFilterByOrg: (orgId: string, orgName: string) => void;
  clearFilter: () => void; // Alias de setFilterAll

  // Geofences Actions
  toggleGeofences: () => void;
  setShowGeofences: (show: boolean) => void;

  setMapStyle: (style: MapStyle) => void;
  setViewport: (viewport: MapViewport) => void;
  resetState: () => void;
}

// Default viewport: Buenos Aires, Argentina
const DEFAULT_VIEWPORT: MapViewport = {
  center: [-34.6037, -58.3816],
  zoom: 11,
};

const initialLabelConfig: LabelConfig = {
  enabled: true,
  showImei: false,
  showPatente: true,
  showEstado: false,
};

const initialState = {
  vehicles: [],
  isLoading: false,
  error: null,
  selectedVehicleId: null,
  searchText: '',
  labelConfig: initialLabelConfig,
  filterMode: 'all' as FilterMode,
  filterOrgName: null,
  filterOrgId: null,
  showGeofences: false,
  mapStyle: 'streets' as MapStyle,
  viewport: DEFAULT_VIEWPORT,
};

export const useTraccarMapStore = create<TraccarMapState>((set) => ({
  ...initialState,

  setVehicles: (vehicles) => set({ vehicles }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSelectedVehicle: (selectedVehicleId) => set({ selectedVehicleId }),
  setSearchText: (searchText) => set({ searchText }),
  toggleLabelField: (field) => set((state) => ({
    labelConfig: {
      ...state.labelConfig,
      [field]: !state.labelConfig[field],
    },
  })),
  setLabelConfig: (config) => set((state) => ({
    labelConfig: {
      ...state.labelConfig,
      ...config,
    },
  })),

  // Nuevas acciones de filtro
  setFilterAll: () => set({ filterMode: 'all', filterOrgName: null, filterOrgId: null }),
  setFilterOwn: () => set({ filterMode: 'own', filterOrgName: null, filterOrgId: null }),
  setFilterByOrg: (orgId, orgName) => set({ filterMode: 'organization', filterOrgId: orgId, filterOrgName: orgName }),
  clearFilter: () => set({ filterMode: 'all', filterOrgName: null, filterOrgId: null }),

  // Geofences actions
  toggleGeofences: () => set((state) => ({ showGeofences: !state.showGeofences })),
  setShowGeofences: (showGeofences) => set({ showGeofences }),

  setMapStyle: (mapStyle) => set({ mapStyle }),
  setViewport: (viewport) => set({ viewport }),
  resetState: () => set(initialState),
}));

// Selector for filtered vehicles based on search and organization filter
export const useFilteredVehicles = () => {
  const vehicles = useTraccarMapStore((state) => state.vehicles);
  const searchText = useTraccarMapStore((state) => state.searchText);

  const filterMode = useTraccarMapStore((state) => state.filterMode);


  let filtered = vehicles;

  // Apply organization filter (Updated Logic)
  if (filterMode === 'own') {
    // Solo propios: aquellos que NO son recurso asociado
    filtered = filtered.filter((v) => !v.esRecursoAsociado);
    // Por organización específica: ignorar filterOrgName ya que no tenemos el campo
    // filtered = filtered; 
  }

  // Apply search filter
  if (searchText.trim()) {
    const search = searchText.toLowerCase();
    filtered = filtered.filter(
      (v) =>
        v.nombre.toLowerCase().includes(search) ||
        (v.patente && v.patente.toLowerCase().includes(search))
    );
  }

  return filtered;
};

