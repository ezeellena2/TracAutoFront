import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTraccarMapStore, useFilteredVehicles } from '../store/traccarMap.store';
import { VehicleMarker } from './VehicleMarker';
import { MapToolbar } from './MapToolbar';
import { GeofenceLayer } from './GeofenceLayer';
import { MAP_TILES } from '../types';
import { useMapShellContext } from './MapShell';

// Fix for default marker icons in webpack/vite builds
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map centering on vehicle selection
function MapController() {
  const map = useMap();
  const { selectedVehicleId, vehicles } = useTraccarMapStore();
  const prevSelectedId = useRef<string | null>(null);

  useEffect(() => {
    if (selectedVehicleId && selectedVehicleId !== prevSelectedId.current) {
      const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
      if (vehicle) {
        map.flyTo([vehicle.latitud, vehicle.longitud], 15, {
          duration: 0.8,
        });
      }
    }
    prevSelectedId.current = selectedVehicleId;
  }, [selectedVehicleId, vehicles, map]);

  return null;
}

// Component to handle map resize when sidebar collapses/expands
function MapResizeHandler() {
  const map = useMap();
  const { isCollapsed } = useMapShellContext();
  const prevCollapsed = useRef<boolean>(isCollapsed);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Get the map container element
    const container = map.getContainer();
    if (container) {
      containerRef.current = container;
    }
  }, [map]);

  useEffect(() => {
    // Only invalidate size when collapse state actually changes
    if (prevCollapsed.current !== isCollapsed) {
      // Multiple attempts to ensure resize happens after DOM updates
      const timers = [
        setTimeout(() => map.invalidateSize(), 50),
        setTimeout(() => map.invalidateSize(), 150),
        setTimeout(() => map.invalidateSize(), 300),
      ];
      prevCollapsed.current = isCollapsed;
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [isCollapsed, map]);

  // Use ResizeObserver to detect container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize calls
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  // Also handle window resize
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return null;
}

export function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const vehicles = useFilteredVehicles();
  const { selectedVehicleId, vehicles: allVehicles, mapStyle, showGeofences } = useTraccarMapStore();

  const tileConfig = MAP_TILES[mapStyle];

  const handleCenterFleet = useCallback(() => {
    if (mapRef.current && vehicles.length > 0) {
      const bounds = L.latLngBounds(
        vehicles.map((v) => [v.latitud, v.longitud] as [number, number])
      );
      mapRef.current.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 0.8,
      });
    }
  }, [vehicles]);

  const handleCenterSelected = useCallback(() => {
    if (mapRef.current && selectedVehicleId) {
      const vehicle = allVehicles.find((v) => v.id === selectedVehicleId);
      if (vehicle) {
        mapRef.current.flyTo([vehicle.latitud, vehicle.longitud], 15, {
          duration: 0.8,
        });
      }
    }
  }, [selectedVehicleId, allVehicles]);

  return (
    <div className="relative w-full h-full">
      <MapToolbar
        onCenterFleet={handleCenterFleet}
        onCenterSelected={handleCenterSelected}
      />
      
      <MapContainer
        center={[-34.6037, -58.3816]}
        zoom={11}
        className="w-full h-full"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          key={mapStyle}
          attribution={tileConfig.attribution}
          url={tileConfig.url}
        />
        
        {/* Custom zoom control positioned to avoid conflicts */}
        <ZoomControl position="bottomright" />
        
        <MapController />
        <MapResizeHandler />
        
        {/* Geofences */}
        <GeofenceLayer 
          visible={showGeofences} 
        />
        
        {vehicles.map((vehicle) => (
          <VehicleMarker key={vehicle.id} vehicle={vehicle} />
        ))}
      </MapContainer>
    </div>
  );
}

