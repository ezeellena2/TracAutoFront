/**
 * Hook for managing replay data and playback
 */

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useReplayStore } from '../store/replay.store';
import { getReplayPositions } from '../api/replay.api';
import { DatePreset, ReplayPosition, PlaybackSpeed } from '../types';

/**
 * Calculate date range from preset
 */
function getDateRangeFromPreset(preset: DatePreset): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today':
      return { from: today, to: now };
    
    case 'yesterday': {
      const yesterdayStart = new Date(today);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      return { from: yesterdayStart, to: today };
    }
    
    case 'thisWeek': {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return { from: weekStart, to: now };
    }
    
    case 'previousWeek': {
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
      const prevWeekStart = new Date(thisWeekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      return { from: prevWeekStart, to: thisWeekStart };
    }
    
    case 'thisMonth': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: monthStart, to: now };
    }
    
    case 'previousMonth': {
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: prevMonthStart, to: thisMonthStart };
    }
    
    case 'custom':
    default:
      return { from: today, to: now };
  }
}

interface UseReplayDataReturn {
  // Data
  positions: ReplayPosition[];
  path: [number, number][];
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
  const playIntervalRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized path for polyline (avoid recalculating on each render)
  const path = useMemo<[number, number][]>(() => {
    return store.positions.map(p => [p.lat, p.lon] as [number, number]);
  }, [store.positions]);

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
      const positions = await getReplayPositions(
        store.selectedDispositivoId,
        store.from,
        store.to,
        store.preset,
        abortControllerRef.current.signal
      );
      store.setPositions(positions);
    } catch (err) {
      // Ignorar errores de cancelación
      if ((err as Error).name === 'AbortError' || (err as Error).name === 'CanceledError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Error al cargar posiciones';
      store.setError(message);
    }
  }, [store]);

  // Set preset and update date range
  const setPreset = useCallback((preset: DatePreset) => {
    store.setPreset(preset);
    if (preset !== 'custom') {
      const { from, to } = getDateRangeFromPreset(preset);
      store.setDateRange(from, to);
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

  // Reset on mount, cleanup on unmount
  useEffect(() => {
    store.resetState(); // Limpiar estado al entrar a la página
    
    return () => {
      abortControllerRef.current?.abort(); // Cancelar request pendiente
      store.resetState(); // Limpiar al salir
    };
  }, []);

  return {
    // Data
    positions: store.positions,
    path,
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
