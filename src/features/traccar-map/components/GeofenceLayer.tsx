/**
 * GeofenceLayer - Capa de geofences para el mapa
 * Consume GeoJSON desde la API y renderiza polígonos/círculos
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Polygon, Circle, Popup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { LatLngExpression } from 'leaflet';
import { turnosTaxiApi } from '@/features/turnos-taxi/api';
import type { TurnoActivoDto, GeofenceGeoJsonDto } from '@/features/turnos-taxi/types';

interface GeofenceLayerProps {
  /** Si se deben mostrar las geofences */
  visible: boolean;
  /** IDs de vehículos para filtrar (opcional, si vacío muestra todos) */
  vehiculoIds?: string[];
  /** Callback cuando se hace clic en una geofence */
  onGeofenceClick?: (geofence: GeofenceGeoJsonDto, turno: TurnoActivoDto) => void;
}

// Colores para diferentes turnos
const GEOFENCE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#ef4444', // red
];

// Parser para geometría de Traccar (formato WKT o GeoJSON)
function parseTraccarGeometry(area: string): { type: 'polygon' | 'circle'; coordinates: LatLngExpression[] | { center: LatLngExpression; radius: number } } | null {
  if (!area) return null;

  // Traccar usa formato POLYGON((lon lat, lon lat, ...)) o CIRCLE(lon lat, radius)
  try {
    // Check for CIRCLE format
    const circleMatch = area.match(/CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([\d.]+)\s*\)/i);
    if (circleMatch) {
      const lon = parseFloat(circleMatch[1]);
      const lat = parseFloat(circleMatch[2]);
      const radius = parseFloat(circleMatch[3]);
      return {
        type: 'circle',
        coordinates: { center: [lat, lon], radius }
      };
    }

    // Check for POLYGON format
    const polygonMatch = area.match(/POLYGON\s*\(\((.*)\)\)/i);
    if (polygonMatch) {
      const coordsStr = polygonMatch[1];
      const coords = coordsStr.split(',').map(pair => {
        const [lon, lat] = pair.trim().split(/\s+/).map(Number);
        return [lat, lon] as LatLngExpression;
      });
      return { type: 'polygon', coordinates: coords };
    }

    // Try parsing as GeoJSON
    if (area.startsWith('{')) {
      const geoJson = JSON.parse(area);
      if (geoJson.type === 'Polygon' && geoJson.coordinates) {
        const coords = geoJson.coordinates[0].map((c: number[]) => [c[1], c[0]] as LatLngExpression);
        return { type: 'polygon', coordinates: coords };
      }
    }

    return null;
  } catch (e) {
    console.error('Error parsing geofence geometry:', e);
    return null;
  }
}

export function GeofenceLayer({ visible, vehiculoIds, onGeofenceClick }: GeofenceLayerProps) {
  const { t } = useTranslation();
  const [turnosActivos, setTurnosActivos] = useState<TurnoActivoDto[]>([]);

  // Fetch turnos activos
  const fetchTurnosActivos = useCallback(async () => {
    if (!visible) return;

    try {
      const result = await turnosTaxiApi.obtenerActivos({
        vehiculoIds: vehiculoIds?.length ? vehiculoIds : undefined,
      });
      setTurnosActivos(result);
    } catch (err) {
      console.error('Error fetching turnos activos:', err);
    }
  }, [visible, vehiculoIds]);

  // Refetch cada 60 segundos si está visible
  useEffect(() => {
    if (!visible) {
      setTurnosActivos([]);
      return;
    }

    fetchTurnosActivos();

    const interval = setInterval(fetchTurnosActivos, 60000);
    return () => clearInterval(interval);
  }, [visible, fetchTurnosActivos]);

  // Mapa de geofences con su turno y color
  const geofencesConColor = useMemo(() => {
    const result: Array<{
      geofence: GeofenceGeoJsonDto;
      turno: TurnoActivoDto;
      color: string;
      geometry: ReturnType<typeof parseTraccarGeometry>;
    }> = [];

    turnosActivos.forEach((turno, turnoIndex) => {
      const color = GEOFENCE_COLORS[turnoIndex % GEOFENCE_COLORS.length];

      turno.geofences.forEach(geofence => {
        const geometry = parseTraccarGeometry(geofence.areaGeoJson);
        if (geometry) {
          result.push({ geofence, turno, color, geometry });
        }
      });
    });

    return result;
  }, [turnosActivos]);

  if (!visible || geofencesConColor.length === 0) {
    return null;
  }

  return (
    <>
      {geofencesConColor.map(({ geofence, turno, color, geometry }) => {
        if (!geometry) return null;

        // Nombre de la geofence (alias o nombre de Traccar)
        const geofenceNombre = geofence.alias || geofence.traccarNombre || `Geofence ${geofence.traccarGeofenceId}`;
        
        const popupContent = (
          <div className="min-w-[150px]">
            <div className="font-medium text-sm">{geofenceNombre}</div>
            <div className="text-xs text-gray-500 mt-1">
              <span className="font-medium">{t('turnosTaxi.turnoActivo', 'Turno activo')}:</span> {turno.nombre}
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-medium">{t('turnosTaxi.vehiculo', 'Vehículo')}:</span> {turno.vehiculoPatente}
            </div>
          </div>
        );

        if (geometry.type === 'circle') {
          const circleData = geometry.coordinates as { center: LatLngExpression; radius: number };
          return (
            <Circle
              key={`${turno.id}-${geofence.id}`}
              center={circleData.center}
              radius={circleData.radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.2,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onGeofenceClick?.(geofence, turno),
              }}
            >
              <Popup>{popupContent}</Popup>
            </Circle>
          );
        }

        if (geometry.type === 'polygon') {
          return (
            <Polygon
              key={`${turno.id}-${geofence.id}`}
              positions={geometry.coordinates as LatLngExpression[]}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.2,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onGeofenceClick?.(geofence, turno),
              }}
            >
              <Popup>{popupContent}</Popup>
            </Polygon>
          );
        }

        return null;
      })}
    </>
  );
}
