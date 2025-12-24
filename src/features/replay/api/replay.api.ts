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
 * REGLAS:
 * - Si preset está presente y no es "custom": Enviar solo preset (backend calcula rango)
 * - Si preset es "custom" o null: Enviar fromLocalDate/toLocalDate (intención local, backend convierte a UTC)
 * 
 * @param dispositivoId - Device ID (TracAuto internal)
 * @param preset - Preset opcional (today, yesterday, etc.). Si está presente y no es "custom", backend calcula rango.
 * @param fromLocalDate - Fecha local de inicio (solo para custom range). Formato: YYYY-MM-DD o YYYY-MM-DDTHH:mm
 * @param toLocalDate - Fecha local de fin (solo para custom range). Formato: YYYY-MM-DD o YYYY-MM-DDTHH:mm
 * @param signal - Optional AbortSignal for cancellation
 * @returns Array of replay positions
 */
export async function getReplayPositions(
  dispositivoId: string,
  preset?: DatePreset,
  fromLocalDate?: string,
  toLocalDate?: string,
  signal?: AbortSignal
): Promise<ReplayPosition[]> {
  const params: Record<string, string> = {
    dispositivoId,
  };

  // Si hay preset y no es custom, enviar solo preset
  if (preset && preset !== 'custom') {
    params.preset = preset;
  } else {
    // Para custom, enviar intención local
    if (fromLocalDate) {
      params.fromLocalDate = fromLocalDate;
    }
    if (toLocalDate) {
      params.toLocalDate = toLocalDate;
    }
    // Si hay preset "custom", también enviarlo
    if (preset === 'custom') {
      params.preset = 'custom';
    }
  }

  const response = await apiClient.get<ReplayPosition[]>(
    `${MAP_BASE}/replay`,
    {
      params,
      signal,
    }
  );
  return response.data;
}

