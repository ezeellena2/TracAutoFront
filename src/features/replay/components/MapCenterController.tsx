/**
 * MapCenterController component
 * Centers the map on a specific location when triggered
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapCenterControllerProps {
  center: [number, number] | null;
  zoom?: number;
}

export function MapCenterController({ center, zoom = 15 }: MapCenterControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] !== 0 && center[1] !== 0) {
      map.setView(center, zoom, { animate: true });
    }
  }, [map, center, zoom]);

  return null;
}
