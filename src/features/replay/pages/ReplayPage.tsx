/**
 * ReplayPage - Main orchestrator for Replay feature
 */

import { MapContainer, TileLayer } from 'react-leaflet';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import { useReplayData } from '../hooks/useReplayData';
import { ReplayFilters } from '../components/ReplayFilters';
import { ReplayControls } from '../components/ReplayControls';
import { ReplayMapLayer } from '../components/ReplayMapLayer';
import { MAP_TILES } from '@/features/traccar-map/types';

// Default center (Buenos Aires, Argentina)
const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];
const DEFAULT_ZOOM = 12;

export function ReplayPage() {
  const {
    positions,
    isLoading,
    error,
    currentIndex,
    isPlaying,
    playbackSpeed,
    selectedDispositivoId,
    preset,
    from,
    to,
    fetchPositions,
    setDispositivo,
    setPreset,
    setDateRange,
    play,
    pause,
    stop,
    seekTo,
    setSpeed,
  } = useReplayData();

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-88px)] -m-6 bg-background">
      {/* Left sidebar: Filters + Controls */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col border-r border-border bg-surface overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <ReplayFilters
            selectedDispositivoId={selectedDispositivoId}
            preset={preset}
            from={from}
            to={to}
            isLoading={isLoading}
            onDispositivoChange={setDispositivo}
            onPresetChange={setPreset}
            onDateRangeChange={setDateRange}
            onLoadClick={fetchPositions}
          />
        </div>
        
        <ReplayControls
          positions={positions}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          speed={playbackSpeed}
          onPlay={play}
          onPause={pause}
          onStop={stop}
          onSeek={seekTo}
          onSpeedChange={setSpeed}
        />
      </div>

      {/* Main: Map */}
      <div className="flex-1 relative">
        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 z-[1000] bg-background/90 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4 text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <AlertCircle size={32} className="text-error" />
              </div>
              <h2 className="text-xl font-semibold text-text">Error</h2>
              <p className="text-text-muted">{error}</p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-[1000] bg-background/80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-text-muted">
              <Loader2 size={48} className="animate-spin" />
              <p className="text-sm">Cargando posiciones...</p>
            </div>
          </div>
        )}

        {/* Empty state overlay */}
        {!isLoading && !error && positions.length === 0 && (
          <div className="absolute inset-0 z-[900] flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-4 text-center max-w-md p-8 bg-surface/90 rounded-2xl shadow-lg">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-text">Replay de Recorridos</h2>
              <p className="text-text-muted text-sm">
                Seleccione un dispositivo y período para visualizar el recorrido histórico.
              </p>
            </div>
          </div>
        )}

        {/* Map */}
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            url={MAP_TILES.dark.url}
            attribution={MAP_TILES.dark.attribution}
          />
          <ReplayMapLayer positions={positions} currentIndex={currentIndex} />
        </MapContainer>
      </div>
    </div>
  );
}
