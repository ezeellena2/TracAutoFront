/**
 * Types for Replay feature
 */

/**
 * Position data for replay from backend
 */
export interface ReplayPosition {
  id: number;
  timestamp: string; // ISO 8601
  lat: number;
  lon: number;
  speed: number;     // km/h
  course: number;    // degrees 0-360
  ignition: boolean | null;
  motion: boolean | null;
}

/**
 * Date presets for replay filter
 */
export type DatePreset = 
  | 'today' 
  | 'yesterday' 
  | 'thisWeek' 
  | 'previousWeek' 
  | 'thisMonth' 
  | 'previousMonth' 
  | 'custom';

/**
 * Preset labels for UI
 */
export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  thisWeek: 'Esta Semana',
  previousWeek: 'Semana Anterior',
  thisMonth: 'Este Mes',
  previousMonth: 'Mes Anterior',
  custom: 'Personalizado',
};

/**
 * Filter parameters for replay query
 */
export interface ReplayFilters {
  dispositivoId: string;
  preset: DatePreset;
  from: Date;
  to: Date;
}

/**
 * Playback state
 */
export interface PlaybackState {
  isPlaying: boolean;
  currentIndex: number;
  speed: number; // 1, 2, 4, 8
}

/**
 * Available playback speeds
 */
export const PLAYBACK_SPEEDS = [1, 2, 4, 8] as const;
export type PlaybackSpeed = typeof PLAYBACK_SPEEDS[number];
