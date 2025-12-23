/**
 * API client for replay positions
 * Connects to MapController backend endpoint
 */

import { apiClient } from '@/services/http/apiClient';
import { ReplayPosition, DatePreset } from '../types';

const MAP_BASE = 'map';

/**
 * API response DTO from backend
 */
interface ReplayPositionApiDto {
  id: number;
  timestamp: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  ignition: boolean | null;
  motion: boolean | null;
}

/**
 * Parse API response to frontend type
 */
function mapToReplayPosition(dto: ReplayPositionApiDto): ReplayPosition {
  return {
    id: dto.id,
    timestamp: dto.timestamp,
    lat: dto.lat,
    lon: dto.lon,
    speed: dto.speed,
    course: dto.course,
    ignition: dto.ignition,
    motion: dto.motion,
  };
}

/**
 * Fetches historical positions for replay.
 * 
 * @param dispositivoId - Device ID (TracAuto internal)
 * @param from - Start date (ISO 8601)
 * @param to - End date (ISO 8601)
 * @param preset - Optional preset for range validation
 * @param signal - Optional AbortSignal for cancellation
 * @returns Array of replay positions
 */
export async function getReplayPositions(
  dispositivoId: string,
  from: Date,
  to: Date,
  preset?: DatePreset,
  signal?: AbortSignal
): Promise<ReplayPosition[]> {
  const response = await apiClient.get<ReplayPositionApiDto[]>(
    `${MAP_BASE}/replay`,
    {
      params: {
        dispositivoId,
        from: from.toISOString(),
        to: to.toISOString(),
        preset,
      },
      signal,
    }
  );
  return response.data.map(mapToReplayPosition);
}

/**
 * Exported API object for consistency with other endpoints
 */
export const replayApi = {
  getReplayPositions,
};
