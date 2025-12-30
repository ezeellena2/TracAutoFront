import { create } from 'zustand';
import { VehiclePosition, MapViewport, MapStyle } from '../types';

interface LabelConfig {
  enabled: boolean;
  showImei: boolean;
  showPatente: boolean;
  showEstado: boolean;
  showOrganizacionAsociada: boolean;
}

interface TraccarMapState {
  // Data
  vehicles: VehiclePosition[];
  isLoading: boolean;
  error: string | null;
  
  // UI State
  selectedVehicleId: string | null;
  searchText: string;
  labelConfig: LabelConfig;
  filterOrganizacionAsociadaId: string | null; // null = todos, "own" = solo propios, GUID = organización específica
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
  setFilterOrganizacionAsociadaId: (id: string | null) => void;
  clearFilter: () => void;
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
  showOrganizacionAsociada: false,
};

const initialState = {
  vehicles: [],
  isLoading: false,
  error: null,
  selectedVehicleId: null,
  searchText: '',
  labelConfig: initialLabelConfig,
  filterOrganizacionAsociadaId: null,
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
  setFilterOrganizacionAsociadaId: (id) => set({ filterOrganizacionAsociadaId: id }),
  clearFilter: () => set({ filterOrganizacionAsociadaId: null }),
  setMapStyle: (mapStyle) => set({ mapStyle }),
  setViewport: (viewport) => set({ viewport }),
  resetState: () => set(initialState),
}));

// Selector for filtered vehicles based on search and organization filter
export const useFilteredVehicles = () => {
  const vehicles = useTraccarMapStore((state) => state.vehicles);
  const searchText = useTraccarMapStore((state) => state.searchText);
  const filterOrganizacionAsociadaId = useTraccarMapStore((state) => state.filterOrganizacionAsociadaId);
  
  let filtered = vehicles;
  
  // Apply organization filter
  if (filterOrganizacionAsociadaId !== null) {
    if (filterOrganizacionAsociadaId === 'own') {
      // Solo propios: sin organizacionAsociadaId
      filtered = filtered.filter((v) => !v.organizacionAsociadaId);
    } else {
      // Organización específica
      filtered = filtered.filter((v) => v.organizacionAsociadaId === filterOrganizacionAsociadaId);
    }
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

