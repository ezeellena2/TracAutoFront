/**
 * API client for map positions in the currently active context.
 * Routes to the personal or organizational backend surface as needed.
 */

import { apiClient } from '../http/apiClient';
import { VehiclePosition } from '@/features/traccar-map/types';

const MAP_BASE = 'map';

/**
 * API response DTO from backend
 */
interface VehiclePositionApiDto {
  id: string;
  nombre: string;
  uniqueId: string;
  patente: string | null;
  latitud: number;
  longitud: number;
  velocidad: number;
  lastUpdateUtc: string;
  estado: string | null;
}

/**
 * Maps API response to frontend VehiclePosition type
 */
function mapToVehiclePosition(dto: VehiclePositionApiDto): VehiclePosition {
  return {
    id: dto.id,
    nombre: dto.nombre,
    imei: dto.uniqueId,
    patente: dto.patente,
    latitud: dto.latitud,
    longitud: dto.longitud,
    velocidad: dto.velocidad,
    lastUpdate: new Date(dto.lastUpdateUtc),
    estado: (dto.estado as VehiclePosition['estado']) ?? 'unknown',
  };
}

/**
 * Fetches vehicle positions for the active context.
 * The backend applies ownership filtering from the JWT context.
 */
export async function getVehiclePositions(soloActivos = true): Promise<VehiclePosition[]> {
  const response = await apiClient.get<VehiclePositionApiDto[]>(
    `${MAP_BASE}/positions`,
    { params: { soloActivos } }
  );
  return response.data.map(mapToVehiclePosition);
}

/**
 * Exported API object for consistency with other endpoints
 */
export const traccarMapApi = {
  getVehiclePositions,
};
