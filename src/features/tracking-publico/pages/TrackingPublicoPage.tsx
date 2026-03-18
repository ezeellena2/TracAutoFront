import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { useTrackingPublico } from '../hooks/useTrackingPublico';
import { TrackingLoadingSkeleton } from '../components/TrackingLoadingSkeleton';
import { TrackingExpiredMessage } from '../components/TrackingExpiredMessage';
import { TrackingConnectionStatus } from '../components/TrackingConnectionStatus';
import { TrackingInfoBar } from '../components/TrackingInfoBar';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export function TrackingPublicoPage() {
  const { token } = useParams<{ token: string }>();
  const { posicion, error, isLoading, connectionState } = useTrackingPublico(token);

  if (isLoading) {
    return <TrackingLoadingSkeleton />;
  }

  if (error || !posicion) {
    return <TrackingExpiredMessage />;
  }

  const rutaCoords: [number, number][] = posicion.ruta?.map((p) => [p.latitud, p.longitud]) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TrackingConnectionStatus connectionState={connectionState} />

      <div className="flex-1 relative">
        <MapContainer
          center={[posicion.latitud, posicion.longitud]}
          zoom={15}
          style={{ height: '100%', width: '100%', minHeight: 'calc(100vh - 120px)' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater lat={posicion.latitud} lng={posicion.longitud} />
          <Marker position={[posicion.latitud, posicion.longitud]} icon={defaultIcon}>
            <Popup>
              {posicion.vehiculoNombre && <p className="font-semibold">{posicion.vehiculoNombre}</p>}
              {posicion.velocidad != null && (
                <p>{Math.round(posicion.velocidad)} km/h</p>
              )}
              <p className="text-xs text-gray-500">
                {new Date(posicion.fechaUltimaPosicion).toLocaleTimeString()}
              </p>
            </Popup>
          </Marker>
          {rutaCoords.length > 1 && (
            <Polyline positions={rutaCoords} color="#3b82f6" weight={3} opacity={0.7} />
          )}
        </MapContainer>
      </div>

      <TrackingInfoBar
        vehiculoNombre={posicion.vehiculoNombre}
        velocidad={posicion.velocidad}
        fechaUltimaPosicion={posicion.fechaUltimaPosicion}
        tipoAcceso={posicion.tipoAcceso}
        organizacionNombre={posicion.organizacionNombre}
      />
    </div>
  );
}
