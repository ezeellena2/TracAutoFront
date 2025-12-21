/**
 * API client for fleet map positions
 * Connects to MapController backend endpoint
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
    patente: dto.uniqueId, // Backend uses uniqueId, frontend displays as patente
    latitud: dto.latitud,
    longitud: dto.longitud,
    velocidad: dto.velocidad,
    lastUpdate: new Date(dto.lastUpdateUtc),
    estado: (dto.estado as VehiclePosition['estado']) ?? 'inactivo',
  };
}

/**
 * Fetches vehicle positions for the current organization's fleet.
 * The backend automatically filters by organization from the JWT token.
 *
 * @param soloActivos Filter only active devices (default: true)
 * @returns Array of vehicle positions
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
