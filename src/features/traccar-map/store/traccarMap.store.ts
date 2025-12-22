import { create } from 'zustand';
import { VehiclePosition, MapViewport, MapStyle } from '../types';

interface TraccarMapState {
  // Data
  vehicles: VehiclePosition[];
  isLoading: boolean;
  error: string | null;
  
  // UI State
  selectedVehicleId: string | null;
  searchText: string;
  showLabels: boolean;
  mapStyle: MapStyle;
  viewport: MapViewport;
  
  // Actions
  setVehicles: (vehicles: VehiclePosition[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedVehicle: (id: string | null) => void;
  setSearchText: (text: string) => void;
  toggleLabels: () => void;
  setMapStyle: (style: MapStyle) => void;
  setViewport: (viewport: MapViewport) => void;
  resetState: () => void;
}

// Default viewport: Buenos Aires, Argentina
const DEFAULT_VIEWPORT: MapViewport = {
  center: [-34.6037, -58.3816],
  zoom: 11,
};

const initialState = {
  vehicles: [],
  isLoading: false,
  error: null,
  selectedVehicleId: null,
  searchText: '',
  showLabels: true,
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
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  setMapStyle: (mapStyle) => set({ mapStyle }),
  setViewport: (viewport) => set({ viewport }),
  resetState: () => set(initialState),
}));

// Selector for filtered vehicles based on search
export const useFilteredVehicles = () => {
  const vehicles = useTraccarMapStore((state) => state.vehicles);
  const searchText = useTraccarMapStore((state) => state.searchText);
  
  if (!searchText.trim()) return vehicles;
  
  const search = searchText.toLowerCase();
  return vehicles.filter(
    (v) =>
      v.nombre.toLowerCase().includes(search) ||
      v.patente.toLowerCase().includes(search)
  );
};

