/**
 * GeofenceLayer - Capa de geofences para el mapa
 * Consume la API de geofences directamente y renderiza polígonos/círculos
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Polygon, Circle, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { geofencesApi } from '@/features/geofences/api';
import { parseTraccarGeometry } from '@/shared/utils/geometryParser';
import { GEOFENCES_PAGE_SIZE, type GeofenceDto } from '@/features/geofences/types';

interface GeofenceLayerProps {
  /** Si se deben mostrar las geofences */
  visible: boolean;
  /** Callback cuando se hace clic en una geofence */
  onGeofenceClick?: (geofence: GeofenceDto) => void;
}

// Colores para diferentes geofences
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

export function GeofenceLayer({ visible, onGeofenceClick }: GeofenceLayerProps) {
  const [geofences, setGeofences] = useState<GeofenceDto[]>([]);

  // Fetch geofences activas
  const fetchGeofences = useCallback(async () => {
    if (!visible) return;

    try {
      const result = await geofencesApi.listar({ soloActivas: true, tamanoPagina: GEOFENCES_PAGE_SIZE });
      setGeofences(result.items);
    } catch (err) {
      console.error('Error fetching geofences:', err);
    }
  }, [visible]);

  // Refetch cada 60 segundos si está visible
  useEffect(() => {
    if (!visible) {
      setGeofences([]);
      return;
    }

    fetchGeofences();

    const interval = setInterval(fetchGeofences, 60000);
    return () => clearInterval(interval);
  }, [visible, fetchGeofences]);

  // Geofences con geometría parseada y color
  const geofencesConGeometria = useMemo(() => {
    return geofences
      .map((geofence, index) => {
        const geometry = parseTraccarGeometry(geofence.geometria);
        const color = GEOFENCE_COLORS[index % GEOFENCE_COLORS.length];
        return geometry ? { geofence, geometry, color } : null;
      })
      .filter(Boolean) as Array<{
        geofence: GeofenceDto;
        geometry: NonNullable<ReturnType<typeof parseTraccarGeometry>>;
        color: string;
      }>;
  }, [geofences]);

  if (!visible || geofencesConGeometria.length === 0) {
    return null;
  }

  return (
    <>
      {geofencesConGeometria.map(({ geofence, geometry, color }) => {
        const popupContent = (
          <div className="min-w-[150px]">
            <div className="font-medium text-sm">{geofence.nombre}</div>
            {geofence.descripcion && (
              <div className="text-xs text-gray-500 mt-1">{geofence.descripcion}</div>
            )}
          </div>
        );

        if (geometry.type === 'circle') {
          const circleData = geometry.coordinates as { center: LatLngExpression; radius: number };
          return (
            <Circle
              key={geofence.id}
              center={circleData.center}
              radius={circleData.radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.2,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onGeofenceClick?.(geofence),
              }}
            >
              <Popup>{popupContent}</Popup>
            </Circle>
          );
        }

        if (geometry.type === 'polygon') {
          return (
            <Polygon
              key={geofence.id}
              positions={geometry.coordinates as LatLngExpression[]}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.2,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onGeofenceClick?.(geofence),
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
