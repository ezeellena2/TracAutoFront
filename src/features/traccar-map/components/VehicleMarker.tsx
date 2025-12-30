import { Marker, Popup, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import { History } from 'lucide-react';
import { VehiclePosition } from '../types';
import { useTraccarMapStore } from '../store/traccarMap.store';
import { useLocalization } from '@/hooks/useLocalization';
import { formatDateTime } from '@/shared/utils';

interface VehicleMarkerProps {
  vehicle: VehiclePosition;
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
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();
  const navigate = useNavigate();
  const { selectedVehicleId, setSelectedVehicle, labelConfig } = useTraccarMapStore();
  const isSelected = selectedVehicleId === vehicle.id;

  const handleReplayClick = () => {
    // Navigate to replay page with device pre-selected
    navigate(`/replay?dispositivoId=${vehicle.id}`);
  };

  // Build label content based on configuration
  const buildLabelContent = () => {
    if (!labelConfig.enabled) return null;

    const items: Array<{ label: string; value: string; variant?: 'success' | 'error' | 'warning' | 'info' }> = [];

    if (labelConfig.showImei) {
      items.push({ label: 'IMEI', value: vehicle.imei });
    }

    if (labelConfig.showPatente && vehicle.patente) {
      items.push({ label: t('vehicles.licensePlate'), value: vehicle.patente });
    }

    if (labelConfig.showEstado) {
      // Usar Map para evitar ternarios anidados complejos
      const statusMap = {
        'online': { text: t('devices.onlineStatus'), variant: 'success' },
        'offline': { text: t('devices.offlineStatus'), variant: 'error' },
        'unknown': { text: t('devices.unknownStatus'), variant: 'warning' }
      } as const;

      const status = statusMap[vehicle.estado as keyof typeof statusMap] || statusMap['unknown'];

      items.push({
        label: t('common.status'),
        value: status.text,
        variant: status.variant
      });
    }

      if (labelConfig.showOrganizacionAsociada && vehicle.organizacionAsociadaNombre) {
        items.push({
          label: t('map.labelConfig.showOrganizacionAsociadaShort'),
          value: vehicle.organizacionAsociadaNombre,
          variant: 'info'
        });
      }

    // Fallback: si no hay nada seleccionado, mostrar nombre
    if (items.length === 0) {
      items.push({ label: t('common.name'), value: vehicle.nombre });
    }

    return items;
  };

  const labelItems = buildLabelContent();

  return (
    <Marker
      position={[vehicle.latitud, vehicle.longitud]}
      icon={createCustomIcon(vehicle.estado, isSelected)}
      eventHandlers={{
        click: () => setSelectedVehicle(vehicle.id),
      }}
    >
      {/* Tooltip with configurable label */}
      {labelItems && labelItems.length > 0 && (
        <Tooltip
          permanent
          direction="top"
          offset={[0, -20]}
          className="vehicle-tooltip"
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0, 0, 0, 0.15)',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: '6px 10px',
              minWidth: 'max-content',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {labelItems.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '6px',
                    lineHeight: '1.3'
                  }}
                >
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.label}:
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: item.variant === 'success' ? '#15803d' :
                      item.variant === 'error' ? '#dc2626' :
                        item.variant === 'warning' ? '#d97706' :
                          item.variant === 'info' ? '#1d4ed8' :
                            '#111827'
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
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
              <span className="font-medium">IMEI:</span> {vehicle.imei}
            </p>
            {vehicle.patente && (
              <p>
                <span className="font-medium">{t('vehicles.licensePlate')}:</span> {vehicle.patente}
              </p>
            )}
            <p>
              <span className="font-medium">{t('common.status')}:</span>{' '}
              <span className={`
                px-1.5 py-0.5 rounded text-xs font-medium
                ${vehicle.estado === 'online' ? 'bg-green-100 text-green-700' : ''}
                ${vehicle.estado === 'offline' ? 'bg-red-100 text-red-700' : ''}
                ${vehicle.estado === 'unknown' ? 'bg-yellow-100 text-yellow-700' : ''}
              `}>
                {vehicle.estado === 'online' ? t('devices.onlineStatus') : vehicle.estado === 'offline' ? t('devices.offlineStatus') : t('devices.unknownStatus')}
              </span>
            </p>
            <p>
              <span className="font-medium">{t('map.speed')}:</span> {vehicle.velocidad} km/h
            </p>
            <p>
              <span className="font-medium">{t('map.lastUpdate')}:</span>
              <br />
              {formatDateTime(new Date(vehicle.lastUpdate), culture, timeZoneId)}
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
            {t('map.viewRoute')}
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

