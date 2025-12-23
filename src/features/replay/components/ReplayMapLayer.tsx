/**
 * ReplayMapLayer component
 * Polyline for route + marker at current position
 */

import { useEffect, useMemo } from 'react';
import { Polyline, CircleMarker, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import { ReplayPosition } from '../types';

interface ReplayMapLayerProps {
  positions: ReplayPosition[];
  currentIndex: number;
}

/**
 * Get color based on speed (green -> yellow -> red)
 */
function getSpeedColor(speed: number): string {
  // 0-30 km/h: green
  // 30-80 km/h: yellow/orange
  // 80+ km/h: red
  if (speed <= 30) return '#22c55e'; // green
  if (speed <= 60) return '#eab308'; // yellow
  if (speed <= 80) return '#f97316'; // orange
  return '#ef4444'; // red
}

export function ReplayMapLayer({ positions, currentIndex }: ReplayMapLayerProps) {
  const map = useMap();

  // Path as [lat, lng] tuples for polyline
  const path = useMemo<[number, number][]>(() => {
    return positions.map(p => [p.lat, p.lon] as [number, number]);
  }, [positions]);

  // Current position
  const currentPosition = positions[currentIndex];

  // Path up to current index (traveled portion)
  const traveledPath = useMemo<[number, number][]>(() => {
    return path.slice(0, currentIndex + 1);
  }, [path, currentIndex]);

  // Path after current index (remaining portion)
  const remainingPath = useMemo<[number, number][]>(() => {
    return path.slice(currentIndex);
  }, [path, currentIndex]);

  // Fit map to path bounds on initial load
  useEffect(() => {
    if (path.length > 1) {
      const bounds = new LatLngBounds(path);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (path.length === 1) {
      map.setView(path[0], 15);
    }
  }, [map, path.length > 0 ? path[0][0] : 0]); // Only on initial load, not every path change

  if (positions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Remaining path (faded) */}
      {remainingPath.length > 1 && (
        <Polyline
          positions={remainingPath}
          pathOptions={{
            color: '#94a3b8',
            weight: 3,
            opacity: 0.4,
            dashArray: '5, 10',
          }}
        />
      )}

      {/* Traveled path (solid, colored by speed) */}
      {traveledPath.length > 1 && (
        <Polyline
          positions={traveledPath}
          pathOptions={{
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
          }}
        />
      )}

      {/* Current position marker */}
      {currentPosition && (
        <CircleMarker
          center={[currentPosition.lat, currentPosition.lon]}
          radius={10}
          pathOptions={{
            fillColor: getSpeedColor(currentPosition.speed),
            fillOpacity: 1,
            color: '#ffffff',
            weight: 3,
          }}
        />
      )}

      {/* Start marker */}
      {positions.length > 0 && (
        <CircleMarker
          center={[positions[0].lat, positions[0].lon]}
          radius={6}
          pathOptions={{
            fillColor: '#22c55e',
            fillOpacity: 1,
            color: '#ffffff',
            weight: 2,
          }}
        />
      )}

      {/* End marker */}
      {positions.length > 1 && (
        <CircleMarker
          center={[positions[positions.length - 1].lat, positions[positions.length - 1].lon]}
          radius={6}
          pathOptions={{
            fillColor: '#ef4444',
            fillOpacity: 1,
            color: '#ffffff',
            weight: 2,
          }}
        />
      )}
    </>
  );
}
