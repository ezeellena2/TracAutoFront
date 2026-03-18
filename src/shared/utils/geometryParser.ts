/**
 * Parser de geometría WKT (Well-Known Text) para geofences
 * Soporta CIRCLE, POLYGON y GeoJSON
 */

import type { LatLngExpression } from 'leaflet';

export interface CircleGeometry {
  type: 'circle';
  coordinates: { center: LatLngExpression; radius: number };
}

export interface PolygonGeometry {
  type: 'polygon';
  coordinates: LatLngExpression[];
}

export interface LineStringGeometry {
  type: 'linestring';
  coordinates: LatLngExpression[];
}

export type ParsedGeometry = CircleGeometry | PolygonGeometry | LineStringGeometry;

/**
 * Parsea una cadena de geometría WKT o GeoJSON a coordenadas de Leaflet.
 *
 * IMPORTANTE: Traccar usa orden "lat lon" para TODAS las geometrías WKT,
 * NO el estándar WKT "lon lat". Ejemplo:
 *   CIRCLE  (lat lon, radius)
 *   POLYGON ((lat lon, lat lon, ...))
 *   LINESTRING (lat lon, lat lon, ...)
 *
 * Leaflet también usa [lat, lng], así que se pasa directo.
 *
 * Formatos soportados:
 * - CIRCLE (lat lon, radius)
 * - POLYGON ((lat lon, lat lon, ...))
 * - LINESTRING (lat lon, lat lon, ...)
 * - GeoJSON Polygon (usa estándar [lon, lat] → se invierte)
 */
export function parseTraccarGeometry(area: string): ParsedGeometry | null {
  if (!area) return null;

  try {
    // Check for CIRCLE format: CIRCLE (lat lon, radius)
    const circleMatch = area.match(/CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([\d.]+)\s*\)/i);
    if (circleMatch) {
      const lat = parseFloat(circleMatch[1]);
      const lon = parseFloat(circleMatch[2]);
      const radius = parseFloat(circleMatch[3]);
      return {
        type: 'circle',
        coordinates: { center: [lat, lon], radius },
      };
    }

    // Check for POLYGON format: POLYGON ((lat lon, lat lon, ...))
    const polygonMatch = area.match(/POLYGON\s*\(\((.*)\)\)/i);
    if (polygonMatch) {
      const coordsStr = polygonMatch[1];
      const coords = coordsStr.split(',').map((pair) => {
        const [lat, lon] = pair.trim().split(/\s+/).map(Number);
        return [lat, lon] as LatLngExpression;
      });
      return { type: 'polygon', coordinates: coords };
    }

    // Check for LINESTRING format: LINESTRING (lat lon, lat lon, ...)
    const lineMatch = area.match(/LINESTRING\s*\((.*)\)/i);
    if (lineMatch) {
      const coordsStr = lineMatch[1];
      const coords = coordsStr.split(',').map((pair) => {
        const [lat, lon] = pair.trim().split(/\s+/).map(Number);
        return [lat, lon] as LatLngExpression;
      });
      return { type: 'linestring', coordinates: coords };
    }

    // Try parsing as GeoJSON (GeoJSON usa estándar [lon, lat] → invertir)
    if (area.startsWith('{')) {
      const geoJson = JSON.parse(area);
      if (geoJson.type === 'Polygon' && geoJson.coordinates) {
        const coords = geoJson.coordinates[0].map(
          (c: number[]) => [c[1], c[0]] as LatLngExpression
        );
        return { type: 'polygon', coordinates: coords };
      }
    }

    return null;
  } catch (e) {
    if (import.meta.env.DEV) console.error('Error parsing geofence geometry:', e);
    return null;
  }
}
