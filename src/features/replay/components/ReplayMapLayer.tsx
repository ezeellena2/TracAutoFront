/**
 * ReplayMapLayer component
 * Polyline for route + marker at current position
 * Path is colored by speed (green -> yellow -> orange -> red)
 */

import { useEffect, useMemo } from 'react';
import { Polyline, CircleMarker, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import { ReplayPosition, getSpeedColor } from '../types';

interface ReplayMapLayerProps {
  positions: ReplayPosition[];
  currentIndex: number;
}

/**
 * Create path segments with their colors for speed visualization
 */
function createSpeedSegments(
  positions: ReplayPosition[],
  endIndex: number
): { path: [number, number][]; color: string }[] {
  const segments: { path: [number, number][]; color: string }[] = [];
  
  for (let i = 0; i < endIndex && i < positions.length - 1; i++) {
    const curr = positions[i];
    const next = positions[i + 1];
    const avgSpeed = (curr.speed + next.speed) / 2;
    
    segments.push({
      path: [
        [curr.lat, curr.lon],
        [next.lat, next.lon]
      ],
      color: getSpeedColor(avgSpeed),
    });
  }
  
  return segments;
}

export function ReplayMapLayer({ positions, currentIndex }: ReplayMapLayerProps) {
  const map = useMap();

  // Path as [lat, lng] tuples for polyline
  const path = useMemo<[number, number][]>(() => {
    return positions.map(p => [p.lat, p.lon] as [number, number]);
  }, [positions]);

  // Current position with guard
  const currentPosition = positions[currentIndex] ?? null;

  // Speed-colored segments for traveled portion
  const traveledSegments = useMemo(() => {
    return createSpeedSegments(positions, currentIndex + 1);
  }, [positions, currentIndex]);

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
      {/* Remaining path (solid blue, slightly lighter) */}
      {remainingPath.length > 1 && (
        <Polyline
          positions={remainingPath}
          pathOptions={{
            color: '#60a5fa',
            weight: 3,
            opacity: 0.6,
          }}
        />
      )}

      {/* Traveled path - speed-colored segments */}
      {traveledSegments.map((segment, idx) => (
        <Polyline
          key={idx}
          positions={segment.path}
          pathOptions={{
            color: segment.color,
            weight: 4,
            opacity: 0.9,
          }}
        />
      ))}

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
