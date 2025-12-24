/**
 * ReplayControls component
 * Play/pause, slider, speed selector
 */

import { Play, Pause, Square, SkipBack, SkipForward } from 'lucide-react';
import { PLAYBACK_SPEEDS, PlaybackSpeed, ReplayPosition } from '../types';

interface ReplayControlsProps {
  positions: ReplayPosition[];
  currentIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (index: number) => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
}

export function ReplayControls({
  positions,
  currentIndex,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onSpeedChange,
}: ReplayControlsProps) {
  const hasPositions = positions.length > 0;
  const currentPosition = positions[currentIndex];

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Format date
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!hasPositions) {
    return (
      <div className="bg-surface border-t border-border p-4 text-center text-text-muted text-sm">
        Seleccione un dispositivo y cargue el recorrido para ver los controles
      </div>
    );
  }

  return (
    <div className="bg-surface border-t border-border p-4 space-y-4">
      {/* Current position info */}
      {currentPosition && (
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-text-muted">Posición:</span>{' '}
            <span className="font-medium text-text">
              {currentIndex + 1} / {positions.length}
            </span>
          </div>
          <div className="text-right">
            <div className="text-text font-medium">{formatTime(currentPosition.timestamp)}</div>
            <div className="text-xs text-text-muted">{formatDate(currentPosition.timestamp)}</div>
          </div>
        </div>
      )}

      {/* Slider */}
      <div>
        <input
          type="range"
          min={0}
          max={positions.length - 1}
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        {/* Playback buttons - centered */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onSeek(0)}
            className="p-2 bg-background rounded-lg hover:bg-background-hover transition-colors"
            title="Ir al inicio"
          >
            <SkipBack size={16} className="text-text" />
          </button>
          
          {isPlaying ? (
            <button
              onClick={onPause}
              className="p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              title="Pausar"
            >
              <Pause size={20} />
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="p-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              title="Reproducir"
            >
              <Play size={20} />
            </button>
          )}
          
          <button
            onClick={onStop}
            className="p-2 bg-background rounded-lg hover:bg-background-hover transition-colors"
            title="Detener"
          >
            <Square size={16} className="text-text" />
          </button>
          
          <button
            onClick={() => onSeek(positions.length - 1)}
            className="p-2 bg-background rounded-lg hover:bg-background-hover transition-colors"
            title="Ir al final"
          >
            <SkipForward size={16} className="text-text" />
          </button>
        </div>

        {/* Speed selector - full width row */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-text-muted">Velocidad:</span>
          <div className="flex gap-1">
            {PLAYBACK_SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  speed === s
                    ? 'bg-primary text-white'
                    : 'bg-background text-text hover:bg-background-hover border border-border'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      {currentPosition && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="text-center">
            <div className="text-xs text-text-muted">Velocidad</div>
            <div className="text-lg font-semibold text-text">
              {currentPosition.speed.toFixed(0)} <span className="text-xs font-normal">km/h</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-text-muted">Estado</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              {currentPosition.ignition !== null && (
                <span className={`px-2 py-0.5 text-xs rounded ${
                  currentPosition.ignition
                    ? 'bg-success/20 text-success'
                    : 'bg-text-muted/20 text-text-muted'
                }`}>
                  {currentPosition.ignition ? 'Encendido' : 'Apagado'}
                </span>
              )}
              {currentPosition.motion !== null && (
                <span className={`px-2 py-0.5 text-xs rounded ${
                  currentPosition.motion
                    ? 'bg-primary/20 text-primary'
                    : 'bg-text-muted/20 text-text-muted'
                }`}>
                  {currentPosition.motion ? 'En movimiento' : 'Detenido'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
