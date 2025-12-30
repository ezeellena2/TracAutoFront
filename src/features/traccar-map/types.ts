/**
 * Represents a vehicle's position and status from Traccar
 */
export interface VehiclePosition {
  id: string;
  nombre: string;
  imei: string;
  patente: string | null;
  latitud: number;
  longitud: number;
  lastUpdate: Date;
  velocidad: number;
  estado: 'online' | 'offline' | 'unknown';
}

/**
 * Summary view for vehicle list
 */
export interface VehicleSummary {
  id: string;
  nombre: string;
  patente: string;
}

/**
 * Map viewport configuration
 */
export interface MapViewport {
  center: [number, number];
  zoom: number;
}

/**
 * Available map styles
 */
export type MapStyle = 'dark' | 'light' | 'satellite' | 'streets';

/**
 * Tile layer configuration for each map style
 */
export interface TileConfig {
  url: string;
  attribution: string;
  label: string;
  icon: string;
}

/**
 * Map tile providers - all free and production-ready
 */
export const MAP_TILES: Record<MapStyle, TileConfig> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: 'Oscuro',
    icon: 'moon',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    label: 'Claro',
    icon: 'sun',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    label: 'Satélite',
    icon: 'satellite',
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    label: 'Calles',
    icon: 'map',
  },
};
