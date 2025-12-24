/**
 * Hook for managing replay data and playback
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useReplayStore } from '../store/replay.store';
import { getReplayPositions } from '../api/replay.api';
import { DatePreset, ReplayPosition, PlaybackSpeed } from '../types';
import { useErrorHandler } from '@/hooks';

interface UseReplayDataReturn {
  // Data
  positions: ReplayPosition[];
  isLoading: boolean;
  error: string | null;
  
  // Current position
  currentPosition: ReplayPosition | null;
  currentIndex: number;
  
  // Playback state
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  
  // Filter state
  selectedDispositivoId: string | null;
  preset: DatePreset;
  from: Date;
  to: Date;
  
  // Actions
  fetchPositions: () => Promise<void>;
  setDispositivo: (id: string | null) => void;
  setPreset: (preset: DatePreset) => void;
  setDateRange: (from: Date, to: Date) => void;
  
  // Playback actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (index: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
}

export function useReplayData(): UseReplayDataReturn {
  const store = useReplayStore();
  const { getErrorMessage } = useErrorHandler();
  const playIntervalRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Current position based on playback index
  const currentPosition = useMemo(() => {
    if (store.positions.length === 0) return null;
    const index = Math.min(store.playback.currentIndex, store.positions.length - 1);
    return store.positions[index] ?? null;
  }, [store.positions, store.playback.currentIndex]);

  // Fetch positions with cancellation support
  const fetchPositions = useCallback(async () => {
    if (!store.selectedDispositivoId) {
      store.setError('Seleccione un dispositivo');
      return;
    }

    // Cancelar request anterior si existe
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    store.setLoading(true);
    store.clearPositions();

    try {
      // REGLA: Si preset está presente y no es "custom", enviar solo preset
      // Si preset es "custom", enviar fromLocalDate/toLocalDate (intención local)
      let fromLocalDate: string | undefined;
      let toLocalDate: string | undefined;

      if (store.preset === 'custom') {
        // Para custom, enviar intención local (formato YYYY-MM-DD o YYYY-MM-DDTHH:mm)
        // El backend convertirá a UTC usando timezone de organización
        fromLocalDate = formatLocalDateForBackend(store.from);
        toLocalDate = formatLocalDateForBackend(store.to);
      }

      const positions = await getReplayPositions(
        store.selectedDispositivoId,
        store.preset,
        fromLocalDate,
        toLocalDate,
        abortControllerRef.current.signal
      );
      store.setPositions(positions);
    } catch (err) {
      // Ignorar errores de cancelación
      if ((err as Error).name === 'AbortError' || (err as Error).name === 'CanceledError') {
        return;
      }
      store.setError(getErrorMessage(err));
    }
  }, [store, getErrorMessage]);

  /**
   * Formatea una fecha local para enviar al backend como "intención local".
   * Formato: YYYY-MM-DD (solo fecha) o YYYY-MM-DDTHH:mm (fecha + hora)
   */
  function formatLocalDateForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    // Si es medianoche (00:00), enviar solo fecha
    if (date.getHours() === 0 && date.getMinutes() === 0) {
      return `${year}-${month}-${day}`;
    }
    
    // Si tiene hora, enviar fecha + hora
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Set preset - NO calcular rangos, backend lo hace
  const setPreset = useCallback((preset: DatePreset) => {
    store.setPreset(preset);
    // Para presets, NO calcular rangos (backend lo calcula)
    // Solo para custom necesitamos mantener from/to para el UI
    if (preset === 'custom') {
      // Mantener from/to actual o inicializar con valores por defecto
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (!store.from || !store.to) {
        store.setDateRange(today, now);
      }
    }
  }, [store]);

  // Playback interval effect
  useEffect(() => {
    if (store.playback.isPlaying && store.positions.length > 0) {
      // Base interval 1000ms, divided by speed
      const interval = 1000 / store.playback.speed;
      
      playIntervalRef.current = window.setInterval(() => {
        store.tick();
      }, interval);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [store.playback.isPlaying, store.playback.speed, store.positions.length, store]);

  // Read URL params and pre-select device on mount
  useEffect(() => {
    store.resetState(); // Limpiar estado al entrar a la página
    
    // Check for dispositivoId in URL
    const urlParams = new URLSearchParams(window.location.search);
    const dispositivoId = urlParams.get('dispositivoId');
    if (dispositivoId) {
      store.setSelectedDispositivo(dispositivoId);
    }
    
    return () => {
      abortControllerRef.current?.abort(); // Cancelar request pendiente
      store.resetState(); // Limpiar al salir
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // Data
    positions: store.positions,
    isLoading: store.isLoading,
    error: store.error,
    
    // Current position
    currentPosition,
    currentIndex: store.playback.currentIndex,
    
    // Playback state
    isPlaying: store.playback.isPlaying,
    playbackSpeed: store.playback.speed as PlaybackSpeed,
    
    // Filter state
    selectedDispositivoId: store.selectedDispositivoId,
    preset: store.preset,
    from: store.from,
    to: store.to,
    
    // Actions
    fetchPositions,
    setDispositivo: store.setSelectedDispositivo,
    setPreset,
    setDateRange: store.setDateRange,
    
    // Playback actions
    play: store.play,
    pause: store.pause,
    stop: store.stop,
    seekTo: store.seekTo,
    setSpeed: store.setSpeed,
  };
}
