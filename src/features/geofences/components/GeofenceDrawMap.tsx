/**
 * Componente de mapa interactivo con Leaflet Draw para dibujar geofences.
 *
 * Mejoras:
 * - `autoStartDraw`: activa automáticamente la herramienta de dibujo al montar.
 * - Desactiva doubleClickZoom para evitar cierre accidental del polígono.
 * - Configuración de drawError para feedback visual al usuario.
 */

import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { TipoGeofence } from '../types';

interface GeofenceDrawMapProps {
  /** Tipo de geometría permitido */
  tipo: TipoGeofence;
  /** Geometría existente en formato WKT (para edición) */
  geometria?: string;
  /** Callback cuando la geometría cambia */
  onGeometriaChange: (wkt: string) => void;
  /** Altura del mapa (CSS value). Default: '400px' */
  height?: string;
  /** Activar la herramienta de dibujo automáticamente al montar (modo crear) */
  autoStartDraw?: boolean;
}

// ====================================================================
// WKT helpers
// ====================================================================

/** Convertir un layer de Leaflet a formato WKT */
function layerToWkt(layer: L.Layer, tipo: TipoGeofence): string | null {
  if (layer instanceof L.Circle) {
    const center = layer.getLatLng();
    const radius = layer.getRadius();
    return `CIRCLE (${center.lat} ${center.lng}, ${radius.toFixed(1)})`;
  }

  if (layer instanceof L.Polygon) {
    const latlngs = layer.getLatLngs()[0] as L.LatLng[];
    const coords = latlngs.map((ll) => `${ll.lng} ${ll.lat}`).join(', ');
    // Cerrar el polígono
    const first = latlngs[0];
    return `POLYGON ((${coords}, ${first.lng} ${first.lat}))`;
  }

  if (layer instanceof L.Polyline && tipo === TipoGeofence.Polyline) {
    const latlngs = layer.getLatLngs() as L.LatLng[];
    const coords = latlngs.map((ll) => `${ll.lng} ${ll.lat}`).join(', ');
    return `LINESTRING (${coords})`;
  }

  return null;
}

/** Parsear WKT para crear capas de Leaflet */
function wktToLayer(wkt: string): L.Layer | null {
  if (!wkt) return null;

  try {
    // CIRCLE
    const circleMatch = wkt.match(
      /CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([\d.]+)\s*\)/i,
    );
    if (circleMatch) {
      const lat = parseFloat(circleMatch[1]);
      const lng = parseFloat(circleMatch[2]);
      const radius = parseFloat(circleMatch[3]);
      return L.circle([lat, lng], { radius });
    }

    // POLYGON
    const polygonMatch = wkt.match(/POLYGON\s*\(\((.*)\)\)/i);
    if (polygonMatch) {
      const coords = polygonMatch[1].split(',').map((pair) => {
        const [lng, lat] = pair.trim().split(/\s+/).map(Number);
        return [lat, lng] as L.LatLngTuple;
      });
      return L.polygon(coords);
    }

    // LINESTRING
    const lineMatch = wkt.match(/LINESTRING\s*\((.*)\)/i);
    if (lineMatch) {
      const coords = lineMatch[1].split(',').map((pair) => {
        const [lng, lat] = pair.trim().split(/\s+/).map(Number);
        return [lat, lng] as L.LatLngTuple;
      });
      return L.polyline(coords);
    }

    return null;
  } catch {
    console.error('Error parsing WKT:', wkt);
    return null;
  }
}

// ====================================================================
// Component
// ====================================================================

export function GeofenceDrawMap({
  tipo,
  geometria,
  onGeometriaChange,
  height = '400px',
  autoStartDraw = false,
}: GeofenceDrawMapProps) {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const activeHandlerRef = useRef<L.Draw.Feature | null>(null);
  const onGeometriaChangeRef = useRef(onGeometriaChange);

  useEffect(() => {
    onGeometriaChangeRef.current = onGeometriaChange;
  });

  // ------------------------------------------------------------------
  // Draw options factory
  // ------------------------------------------------------------------
  const getDrawOptions = useCallback((): L.Control.DrawConstructorOptions => {
    const baseOptions: L.Control.DrawConstructorOptions = {
      position: 'topright',
      draw: {
        polyline: false,
        polygon: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: featureGroupRef.current!,
        remove: true,
      },
    };

    switch (tipo) {
      case TipoGeofence.Polygon:
        baseOptions.draw!.polygon = {
          allowIntersection: false,
          showArea: true,
          drawError: {
            color: '#ef4444',
            message: '<strong>No se permiten intersecciones</strong>',
          },
          shapeOptions: {
            color: '#3b82f6',
            fillOpacity: 0.2,
          },
        };
        break;
      case TipoGeofence.Circle:
        baseOptions.draw!.circle = {
          shapeOptions: {
            color: '#3b82f6',
            fillOpacity: 0.2,
          },
        };
        break;
      case TipoGeofence.Polyline:
        baseOptions.draw!.polyline = {
          shapeOptions: {
            color: '#3b82f6',
          },
        };
        break;
    }

    return baseOptions;
  }, [tipo]);

  // ------------------------------------------------------------------
  // Programmatically enable the draw handler for the current tipo
  // ------------------------------------------------------------------
  const enableDrawHandler = useCallback(
    (map: L.Map, drawOptions: L.Control.DrawConstructorOptions) => {
      // Disable any active handler first
      if (activeHandlerRef.current) {
        activeHandlerRef.current.disable();
        activeHandlerRef.current = null;
      }

      let handler: L.Draw.Feature | null = null;

      switch (tipo) {
        case TipoGeofence.Polygon: {
          const opts = drawOptions.draw?.polygon;
          handler = new (L.Draw as any).Polygon(
            map,
            typeof opts === 'object' ? opts : {},
          );
          break;
        }
        case TipoGeofence.Circle: {
          const opts = drawOptions.draw?.circle;
          handler = new (L.Draw as any).Circle(
            map,
            typeof opts === 'object' ? opts : {},
          );
          break;
        }
        case TipoGeofence.Polyline: {
          const opts = drawOptions.draw?.polyline;
          handler = new (L.Draw as any).Polyline(
            map,
            typeof opts === 'object' ? opts : {},
          );
          break;
        }
      }

      if (handler) {
        handler.enable();
        activeHandlerRef.current = handler;
      }
    },
    [tipo],
  );

  // ------------------------------------------------------------------
  // Main effect: setup draw control + events + auto-start
  // ------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const fg = featureGroupRef.current;
    if (!map || !fg) return;

    // Limpiar control anterior
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
    }

    // Deshabilitar double-click zoom para evitar cierre accidental del polígono
    map.doubleClickZoom.disable();

    // Limpiar capas
    fg.clearLayers();

    // Si hay geometría existente, agregarla
    if (geometria) {
      const layer = wktToLayer(geometria);
      if (layer) {
        fg.addLayer(layer);
        // Centrar mapa en la geometría
        const bounds = fg.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }

    // Crear nuevo control draw
    const drawOptions = getDrawOptions();
    const drawControl = new L.Control.Draw(drawOptions);
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    // ---- Auto-start drawing ----
    if (autoStartDraw && !geometria) {
      // Pequeño delay para que el mapa termine de renderizar
      const autoStartTimer = setTimeout(() => {
        enableDrawHandler(map, drawOptions);
      }, 400);

      // Limpiar el timer si el effect se desmonta antes
      const cleanup = () => clearTimeout(autoStartTimer);
      // Guardamos referencia para el cleanup final
      (map as any).__autoStartCleanup = cleanup;
    }

    // ---- Eventos de dibujo ----
    const onCreated = (e: L.LeafletEvent) => {
      const drawEvent = e as L.DrawEvents.Created;
      // Solo permitir 1 geometría a la vez
      fg.clearLayers();
      fg.addLayer(drawEvent.layer);

      const wkt = layerToWkt(drawEvent.layer, tipo);
      if (wkt) {
        onGeometriaChangeRef.current(wkt);
      }

      // Limpiar referencia al handler activo
      activeHandlerRef.current = null;
    };

    const onEdited = (e: L.LeafletEvent) => {
      const editEvent = e as L.DrawEvents.Edited;
      editEvent.layers.eachLayer((layer) => {
        const wkt = layerToWkt(layer, tipo);
        if (wkt) {
          onGeometriaChangeRef.current(wkt);
        }
      });
    };

    const onDeleted = () => {
      onGeometriaChangeRef.current('');
    };

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.EDITED, onEdited);
    map.on(L.Draw.Event.DELETED, onDeleted);

    return () => {
      // Cleanup auto-start timer
      if ((map as any).__autoStartCleanup) {
        (map as any).__autoStartCleanup();
        delete (map as any).__autoStartCleanup;
      }

      // Cleanup active draw handler
      if (activeHandlerRef.current) {
        activeHandlerRef.current.disable();
        activeHandlerRef.current = null;
      }

      // Cleanup events
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.EDITED, onEdited);
      map.off(L.Draw.Event.DELETED, onDeleted);

      // Cleanup control
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }

      // Re-enable double-click zoom
      map.doubleClickZoom.enable();
    };
  }, [tipo, geometria, getDrawOptions, autoStartDraw, enableDrawHandler]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[-34.6037, -58.3816]} // Buenos Aires por defecto
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FeatureGroup ref={featureGroupRef} />
      </MapContainer>
    </div>
  );
}
