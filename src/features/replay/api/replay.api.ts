/**
 * API client for replay positions
 * Connects to MapController backend endpoint
 */

import { apiClient } from '@/services/http/apiClient';
import { ReplayPosition, DatePreset } from '../types';

const MAP_BASE = 'map';

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
  const response = await apiClient.get<ReplayPosition[]>(
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
  return response.data;
}

