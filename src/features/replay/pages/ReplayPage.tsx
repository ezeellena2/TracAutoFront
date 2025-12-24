/**
 * ReplayPage - Main orchestrator for Replay feature
 * Reuses MapShell for consistent layout with main map
 */

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Loader2, MapPin, AlertCircle, History } from 'lucide-react';
import { useReplayData } from '../hooks/useReplayData';
import { ReplayFilters } from '../components/ReplayFilters';
import { ReplayControls } from '../components/ReplayControls';
import { ReplayMapLayer } from '../components/ReplayMapLayer';
import { ReplayToolbar } from '../components/ReplayToolbar';
import { MapCenterController } from '../components/MapCenterController';
import { MapShell } from '@/features/traccar-map/components/MapShell';
import { MAP_TILES, MapStyle } from '@/features/traccar-map/types';
import { getVehiclePositions } from '@/services/traccar/traccarMap.api';

// Default center (Buenos Aires, Argentina)
const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];
const DEFAULT_ZOOM = 12;

export function ReplayPage() {
  const [mapStyle, setMapStyle] = useState<MapStyle>('streets');
  const [deviceCenter, setDeviceCenter] = useState<[number, number] | null>(null);
  
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

  // Fetch and center map on device position when selected
  useEffect(() => {
    if (!selectedDispositivoId) {
      setDeviceCenter(null);
      return;
    }

    const fetchDevicePosition = async () => {
      try {
        const vehiclePositions = await getVehiclePositions(true);
        const device = vehiclePositions.find(v => v.id === selectedDispositivoId);
        if (device && device.latitud !== 0 && device.longitud !== 0) {
          setDeviceCenter([device.latitud, device.longitud]);
        }
      } catch (err) {
        console.error('Error fetching device position:', err);
      }
    };

    fetchDevicePosition();
  }, [selectedDispositivoId]);

  // Sidebar content
  const sidebar = (
    <div className="flex flex-col h-full bg-surface border-r border-border overflow-hidden">
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
  );

  // Map content
  const map = (
    <div className="relative w-full h-full">
      {/* Toolbar with map style dropdown */}
      <ReplayToolbar 
        mapStyle={mapStyle} 
        onStyleChange={setMapStyle} 
      />

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

      {/* Empty state hint - subtle at bottom left */}
      {!isLoading && !error && positions.length === 0 && (
        <div className="absolute bottom-4 left-4 z-[900] flex items-center gap-3 px-4 py-3 bg-surface/95 backdrop-blur-sm rounded-lg shadow-lg border border-border max-w-xs">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
            <MapPin size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-text text-sm font-medium">Replay de Recorridos</p>
            <p className="text-text-muted text-xs">
              Seleccione un dispositivo y período
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
          key={mapStyle}
          url={MAP_TILES[mapStyle].url}
          attribution={MAP_TILES[mapStyle].attribution}
        />
        {/* Center map on device when selected */}
        <MapCenterController center={deviceCenter} />
        <ReplayMapLayer positions={positions} currentIndex={currentIndex} />
      </MapContainer>
    </div>
  );

  return (
    <MapShell 
      sidebar={sidebar} 
      map={map} 
      itemCount={positions.length}
      CollapsedIcon={History}
    />
  );
}
