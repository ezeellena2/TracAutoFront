import { Marker, Popup, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { History } from 'lucide-react';
import { VehiclePosition } from '../types';
import { useTraccarMapStore } from '../store/traccarMap.store';

interface VehicleMarkerProps {
  vehicle: VehiclePosition;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMarkerColor(estado: VehiclePosition['estado']): string {
  switch (estado) {
    case 'online':
      return '#22c55e'; // success - green
    case 'offline':
      return '#ef4444'; // error - red (matches DevicesPage)
    case 'unknown':
    default:
      return '#f59e0b'; // warning - yellow
  }
}

function createCustomIcon(estado: VehiclePosition['estado'], isSelected: boolean) {
  const color = getMarkerColor(estado);
  const size = isSelected ? 36 : 28;
  const borderWidth = isSelected ? 4 : 2;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid ${isSelected ? '#2563eb' : '#fff'};
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
          <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
          <path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function VehicleMarker({ vehicle }: VehicleMarkerProps) {
  const navigate = useNavigate();
  const { selectedVehicleId, setSelectedVehicle, showLabels } = useTraccarMapStore();
  const isSelected = selectedVehicleId === vehicle.id;

  const handleReplayClick = () => {
    // Navigate to replay page with device pre-selected
    navigate(`/replay?dispositivoId=${vehicle.id}`);
  };

  return (
    <Marker
      position={[vehicle.latitud, vehicle.longitud]}
      icon={createCustomIcon(vehicle.estado, isSelected)}
      eventHandlers={{
        click: () => setSelectedVehicle(vehicle.id),
      }}
    >
      {/* Tooltip with vehicle name (shows on hover or always if labels enabled) */}
      {showLabels && (
        <Tooltip 
          permanent 
          direction="top" 
          offset={[0, -20]}
          className="vehicle-tooltip"
        >
          <span className="font-medium text-xs">{vehicle.patente}</span>
        </Tooltip>
      )}

      {/* Popup with full details */}
      <Popup>
        <div className="min-w-[200px] p-1">
          <h3 className="font-bold text-gray-900 text-base mb-1">
            {vehicle.nombre}
          </h3>
          <div className="space-y-1 text-sm text-gray-700">
            <p>
              <span className="font-medium">Patente:</span> {vehicle.patente}
            </p>
            <p>
              <span className="font-medium">Estado:</span>{' '}
              <span className={`
                px-1.5 py-0.5 rounded text-xs font-medium
                ${vehicle.estado === 'online' ? 'bg-green-100 text-green-700' : ''}
                ${vehicle.estado === 'offline' ? 'bg-red-100 text-red-700' : ''}
                ${vehicle.estado === 'unknown' ? 'bg-yellow-100 text-yellow-700' : ''}
              `}>
                {vehicle.estado === 'online' ? 'Online' : vehicle.estado === 'offline' ? 'Offline' : 'Desconocido'}
              </span>
            </p>
            <p>
              <span className="font-medium">Velocidad:</span> {vehicle.velocidad} km/h
            </p>
            <p>
              <span className="font-medium">Última actualización:</span>
              <br />
              {formatDateTime(vehicle.lastUpdate)}
            </p>
            <p className="text-xs text-gray-500 pt-1 border-t border-gray-200 mt-2">
              Lat: {vehicle.latitud.toFixed(6)} | Lng: {vehicle.longitud.toFixed(6)}
            </p>
          </div>
          
          {/* Ver recorrido button */}
          <button
            onClick={handleReplayClick}
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <History size={16} />
            Ver recorrido
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

