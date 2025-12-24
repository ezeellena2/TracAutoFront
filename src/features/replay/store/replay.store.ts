/**
 * Zustand store for Replay feature
 */

import { create } from 'zustand';
import { ReplayPosition, PlaybackState, DatePreset, PlaybackSpeed, PLAYBACK_SPEEDS } from '../types';

interface ReplayStore {
  // Data state
  positions: ReplayPosition[];
  isLoading: boolean;
  error: string | null;

  // Filter state
  selectedDispositivoId: string | null;
  preset: DatePreset;
  from: Date;
  to: Date;

  // Playback state
  playback: PlaybackState;

  // Actions - Data
  setPositions: (positions: ReplayPosition[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearPositions: () => void;

  // Actions - Filters
  setSelectedDispositivo: (id: string | null) => void;
  setPreset: (preset: DatePreset) => void;
  setDateRange: (from: Date, to: Date) => void;

  // Actions - Playback
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (index: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  tick: () => void;

  // Reset
  resetState: () => void;
}

const getDefaultDateRange = (): { from: Date; to: Date } => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  return {
    from: startOfToday,
    to: now,
  };
};

const initialPlayback: PlaybackState = {
  isPlaying: false,
  currentIndex: 0,
  speed: 1,
};

export const useReplayStore = create<ReplayStore>((set, get) => ({
  // Initial data state
  positions: [],
  isLoading: false,
  error: null,

  // Initial filter state
  selectedDispositivoId: null,
  preset: 'today',
  ...getDefaultDateRange(),

  // Initial playback state
  playback: { ...initialPlayback },

  // Data actions
  setPositions: (positions) => set({ positions, error: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearPositions: () => set({ positions: [], playback: { ...initialPlayback } }),

  // Filter actions
  setSelectedDispositivo: (id) => set({ selectedDispositivoId: id }),
  setPreset: (preset) => set({ preset }),
  setDateRange: (from, to) => set({ from, to }),

  // Playback actions
  play: () => set((state) => ({
    playback: { ...state.playback, isPlaying: true }
  })),
  
  pause: () => set((state) => ({
    playback: { ...state.playback, isPlaying: false }
  })),
  
  stop: () => set({
    playback: { ...initialPlayback }
  }),
  
  seekTo: (index) => set((state) => ({
    playback: {
      ...state.playback,
      currentIndex: Math.max(0, Math.min(index, state.positions.length - 1))
    }
  })),
  
  setSpeed: (speed) => {
    if (PLAYBACK_SPEEDS.includes(speed)) {
      set((state) => ({
        playback: { ...state.playback, speed }
      }));
    }
  },

  tick: () => {
    const state = get();
    if (!state.playback.isPlaying) return;
    
    const nextIndex = state.playback.currentIndex + 1;
    if (nextIndex >= state.positions.length) {
      // Reached end, stop playback
      set({
        playback: {
          ...state.playback,
          isPlaying: false,
          currentIndex: state.positions.length - 1
        }
      });
    } else {
      set({
        playback: { ...state.playback, currentIndex: nextIndex }
      });
    }
  },

  // Reset
  resetState: () => set({
    positions: [],
    isLoading: false,
    error: null,
    selectedDispositivoId: null,
    preset: 'today',
    ...getDefaultDateRange(),
    playback: { ...initialPlayback },
  }),
}));
