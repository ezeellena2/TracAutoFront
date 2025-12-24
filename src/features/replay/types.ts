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

/**
 * Speed color thresholds for path visualization
 * Used in ReplayMapLayer for consistent coloring
 */
export const SPEED_COLORS = {
  stopped: '#6b7280',   // gray (≤10 km/h)
  slow: '#22c55e',      // green (≤30 km/h)
  normal: '#eab308',    // yellow (≤60 km/h)
  fast: '#f97316',      // orange (≤80 km/h)
  veryFast: '#ef4444',  // red (>80 km/h)
} as const;

/**
 * Get speed color based on velocity
 */
export function getSpeedColor(speed: number): string {
  if (speed <= 10) return SPEED_COLORS.stopped;
  if (speed <= 30) return SPEED_COLORS.slow;
  if (speed <= 60) return SPEED_COLORS.normal;
  if (speed <= 80) return SPEED_COLORS.fast;
  return SPEED_COLORS.veryFast;
}

