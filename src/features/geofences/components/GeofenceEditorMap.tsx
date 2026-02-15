/**
 * Mapa del editor de geozonas — powered by Leaflet Geoman.
 *
 * Funcionalidades:
 *   - Capa de geozonas existentes (read-only, bordes punteados)
 *   - Dibujo de polígonos, círculos y líneas con Geoman
 *   - Edición de vértices con drag nativo
 *   - Arrastre de figuras completas (Geoman drag mode)
 *   - Auto-fit de bounds a las geozonas existentes
 *   - Resize handler para el colapso del sidebar
 *   - Idioma español nativo de Geoman
 *   - Controles estilizados con la estética del sitio
 */

import { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Circle,
  Polyline,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

import { TipoGeofence } from '../types';
import type { GeofenceDto } from '../types';
import { parseTraccarGeometry } from '@/shared/utils/geometryParser';
import { useMapShellContext } from '@/features/traccar-map/components/MapShell';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface GeofenceEditorMapProps {
  tipo: TipoGeofence;
  geometria?: string;
  onGeometriaChange: (wkt: string) => void;
  autoStartDraw?: boolean;
  existingGeofences: GeofenceDto[];
}

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const GEOFENCE_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
  '#ec4899', '#06b6d4', '#6366f1', '#ef4444',
];

const DEFAULT_CENTER: L.LatLngExpression = [-34.6037, -58.3816];

const ACTIVE_SHAPE_STYLE: L.PathOptions = {
  color: '#3b82f6',
  fillColor: '#3b82f6',
  fillOpacity: 0.15,
  weight: 3,
};

/* ------------------------------------------------------------------ */
/*  CSS – Estilizar controles de Geoman con la estética del sitio      */
/* ------------------------------------------------------------------ */

const GEOMAN_STYLES = `
  /* ── Contenedor de la barra de herramientas ── */
  .geofence-editor-map .leaflet-pm-toolbar {
    border: none !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
    border-radius: 10px !important;
    overflow: hidden !important;
    background: #fff !important;
  }

  /* ── Botones de la barra ── */
  .geofence-editor-map .leaflet-pm-toolbar .leaflet-pm-icon-delete,
  .geofence-editor-map .leaflet-pm-toolbar .leaflet-pm-icon-edit,
  .geofence-editor-map .leaflet-pm-toolbar .leaflet-pm-icon-drag,
  .geofence-editor-map .leaflet-pm-toolbar .leaflet-pm-icon-polygon,
  .geofence-editor-map .leaflet-pm-toolbar .leaflet-pm-icon-circle,
  .geofence-editor-map .leaflet-pm-toolbar .leaflet-pm-icon-polyline {
    /* Los iconos de geoman ya son SVG buenos */
  }

  .geofence-editor-map .leaflet-pm-toolbar .button-container {
    border: none !important;
  }

  .geofence-editor-map .leaflet-pm-toolbar .button-container .leaflet-buttons-control-button {
    width: 38px !important;
    height: 38px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: background-color 0.15s ease !important;
    border: none !important;
    background: #fff !important;
  }

  .geofence-editor-map .leaflet-pm-toolbar .button-container .leaflet-buttons-control-button:hover {
    background: #eff6ff !important;
  }

  .geofence-editor-map .leaflet-pm-toolbar .button-container.active .leaflet-buttons-control-button {
    background: #3b82f6 !important;
  }

  .geofence-editor-map .leaflet-pm-toolbar .button-container.active .leaflet-buttons-control-button .leaflet-pm-toolbar-action {
    color: #fff !important;
  }

  /* SVG dentro del botón activo → blanco */
  .geofence-editor-map .leaflet-pm-toolbar .button-container.active .control-icon {
    filter: brightness(0) invert(1) !important;
  }

  /* ── Barra de acciones (Finish, Cancel, etc.) ── */
  .geofence-editor-map .leaflet-pm-actions-container {
    background: #fff !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
    border: none !important;
    padding: 4px !important;
    margin-top: 4px !important;
  }

  .geofence-editor-map .leaflet-pm-actions-container a {
    font-size: 12px !important;
    font-weight: 500 !important;
    padding: 5px 12px !important;
    border-radius: 6px !important;
    background-color: #3b82f6 !important;
    color: #fff !important;
    border: none !important;
    transition: background-color 0.15s ease !important;
    text-decoration: none !important;
    display: inline-block !important;
    margin: 2px !important;
  }

  .geofence-editor-map .leaflet-pm-actions-container a:hover {
    background-color: #2563eb !important;
  }

  /* Botón "Cancelar" en rojo suave */
  .geofence-editor-map .leaflet-pm-actions-container a.leaflet-pm-action-cancel,
  .geofence-editor-map .leaflet-pm-actions-container a[data-action="cancel"] {
    background-color: #f3f4f6 !important;
    color: #374151 !important;
  }
  .geofence-editor-map .leaflet-pm-actions-container a.leaflet-pm-action-cancel:hover,
  .geofence-editor-map .leaflet-pm-actions-container a[data-action="cancel"]:hover {
    background-color: #e5e7eb !important;
  }

  /* ── Tooltips de dibujo ── */
  .geofence-editor-map .leaflet-tooltip.leaflet-draw-tooltip,
  .geofence-editor-map .leaflet-tooltip {
    font-size: 12px !important;
    border-radius: 6px !important;
    padding: 6px 10px !important;
    background: rgba(0,0,0,0.8) !important;
    border: none !important;
    color: #fff !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
  }
`;

/* ------------------------------------------------------------------ */
/*  WKT helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Convierte un layer de Leaflet a WKT en formato Traccar.
 *
 * IMPORTANTE: Traccar usa orden "lat lon" para TODAS las geometrías
 * (no el estándar WKT "lon lat"). Por eso usamos `ll.lat ll.lng`.
 */
function layerToWkt(layer: L.Layer, tipo: TipoGeofence): string | null {
  if (layer instanceof L.Circle) {
    const center = layer.getLatLng();
    const radius = layer.getRadius();
    return `CIRCLE (${center.lat} ${center.lng}, ${radius.toFixed(1)})`;
  }
  if (layer instanceof L.Polygon) {
    const latlngs = layer.getLatLngs()[0] as L.LatLng[];
    const coords = latlngs.map((ll) => `${ll.lat} ${ll.lng}`).join(', ');
    const first = latlngs[0];
    return `POLYGON ((${coords}, ${first.lat} ${first.lng}))`;
  }
  if (layer instanceof L.Polyline && tipo === TipoGeofence.Polyline) {
    const latlngs = layer.getLatLngs() as L.LatLng[];
    const coords = latlngs.map((ll) => `${ll.lat} ${ll.lng}`).join(', ');
    return `LINESTRING (${coords})`;
  }
  return null;
}

/**
 * Parsea un WKT en formato Traccar a un layer de Leaflet.
 *
 * IMPORTANTE: Traccar usa orden "lat lon" (no el estándar "lon lat").
 * El primer valor es latitud, el segundo es longitud.
 */
function wktToLayer(wkt: string): L.Layer | null {
  if (!wkt) return null;
  try {
    const circleMatch = wkt.match(/CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([\d.]+)\s*\)/i);
    if (circleMatch) {
      // CIRCLE (lat lon, radius)
      return L.circle(
        [parseFloat(circleMatch[1]), parseFloat(circleMatch[2])],
        { radius: parseFloat(circleMatch[3]), ...ACTIVE_SHAPE_STYLE },
      );
    }
    const polygonMatch = wkt.match(/POLYGON\s*\(\((.*)\)\)/i);
    if (polygonMatch) {
      // POLYGON ((lat lon, lat lon, ...))
      const coords = polygonMatch[1].split(',').map((pair) => {
        const [lat, lng] = pair.trim().split(/\s+/).map(Number);
        return [lat, lng] as L.LatLngTuple;
      });
      return L.polygon(coords, ACTIVE_SHAPE_STYLE);
    }
    const lineMatch = wkt.match(/LINESTRING\s*\((.*)\)/i);
    if (lineMatch) {
      // LINESTRING (lat lon, lat lon, ...)
      const coords = lineMatch[1].split(',').map((pair) => {
        const [lat, lng] = pair.trim().split(/\s+/).map(Number);
        return [lat, lng] as L.LatLngTuple;
      });
      return L.polyline(coords, { color: '#3b82f6', weight: 3 });
    }
    return null;
  } catch {
    console.error('Error parsing WKT:', wkt);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  GeomanController – Sub-componente que maneja Leaflet Geoman        */
/* ------------------------------------------------------------------ */

function GeomanController({
  tipo,
  geometria,
  onGeometriaChange,
  autoStartDraw,
}: {
  tipo: TipoGeofence;
  geometria?: string;
  onGeometriaChange: (wkt: string) => void;
  autoStartDraw: boolean;
}) {
  const map = useMap();
  const onChangeRef = useRef(onGeometriaChange);
  const activeLayerRef = useRef<L.Layer | null>(null);
  const isInitializedRef = useRef(false);
  const layerListenersCleanupRef = useRef<(() => void) | null>(null);

  // Mantener la referencia actualizada
  useEffect(() => {
    onChangeRef.current = onGeometriaChange;
  });

  // Función para obtener WKT del layer activo
  const emitWkt = useCallback((layer: L.Layer) => {
    const wkt = layerToWkt(layer, tipo);
    if (wkt) onChangeRef.current(wkt);
  }, [tipo]);

  // Desconectar listeners del layer activo
  const detachLayerListeners = useCallback(() => {
    if (layerListenersCleanupRef.current) {
      layerListenersCleanupRef.current();
      layerListenersCleanupRef.current = null;
    }
  }, []);

  // Conectar listeners a un layer (edit, drag, etc.)
  const attachLayerListeners = useCallback((layer: L.Layer) => {
    detachLayerListeners();

    // Cuando se editan vértices
    const onEdit = () => emitWkt(layer);
    // Cuando se termina de arrastrar
    const onDragEnd = () => emitWkt(layer);
    // Cuando se mueve un marcador de vértice
    const onMarkerDragEnd = () => emitWkt(layer);
    // Cuando se mueve el centro de un círculo
    const onCenterPlaced = () => emitWkt(layer);
    // pm:update se dispara al desactivar Edit Mode si hubo cambios
    const onUpdate = () => emitWkt(layer);

    layer.on('pm:edit', onEdit);
    layer.on('pm:dragend', onDragEnd);
    layer.on('pm:markerdragend', onMarkerDragEnd);
    layer.on('pm:centerplaced', onCenterPlaced);
    layer.on('pm:update', onUpdate);

    layerListenersCleanupRef.current = () => {
      layer.off('pm:edit', onEdit);
      layer.off('pm:dragend', onDragEnd);
      layer.off('pm:markerdragend', onMarkerDragEnd);
      layer.off('pm:centerplaced', onCenterPlaced);
      layer.off('pm:update', onUpdate);
    };
  }, [detachLayerListeners, emitWkt]);

  // Función para limpiar el layer activo
  const clearActiveLayer = useCallback(() => {
    detachLayerListeners();
    if (activeLayerRef.current) {
      map.removeLayer(activeLayerRef.current);
      activeLayerRef.current = null;
    }
  }, [map, detachLayerListeners]);

  // Función para configurar un layer como activo (editable + draggable)
  const setActiveLayer = useCallback((layer: L.Layer) => {
    clearActiveLayer();
    activeLayerRef.current = layer;

    if (!map.hasLayer(layer)) {
      layer.addTo(map);
    }

    // Conectar listeners de edición/drag al layer
    attachLayerListeners(layer);

    // Emitir WKT inicial
    emitWkt(layer);
  }, [map, clearActiveLayer, attachLayerListeners, emitWkt]);

  useEffect(() => {
    // Idioma español
    map.pm.setLang('es');

    // Mapa de tipo → forma de Geoman
    const shapeMap: Record<TipoGeofence, string> = {
      [TipoGeofence.Polygon]: 'Polygon',
      [TipoGeofence.Circle]: 'Circle',
      [TipoGeofence.Polyline]: 'Line',
    };

    // ── Limpiar estado anterior ──
    map.pm.disableDraw();
    map.pm.disableGlobalEditMode();
    map.pm.disableGlobalDragMode();
    map.pm.removeControls();
    clearActiveLayer();

    // ── Configurar controles del toolbar ──
    map.pm.addControls({
      position: 'topright',
      // Solo habilitar el tipo de dibujo actual
      drawPolygon: tipo === TipoGeofence.Polygon,
      drawCircle: tipo === TipoGeofence.Circle,
      drawPolyline: tipo === TipoGeofence.Polyline,
      // Deshabilitar lo que no se usa
      drawMarker: false,
      drawCircleMarker: false,
      drawRectangle: false,
      drawText: false,
      cutPolygon: false,
      rotateMode: false,
      // Habilitar modos de edición
      editMode: true,
      dragMode: true,
      removalMode: true,
    });

    // Estilo para las formas dibujadas
    map.pm.setPathOptions(ACTIVE_SHAPE_STYLE);

    // Opciones globales
    map.pm.setGlobalOptions({
      snappable: true,
      snapDistance: 15,
      allowSelfIntersection: false,
      tooltips: true,
      layerGroup: map,
    });

    // ── Cargar geometría existente (modo edición) ──
    if (geometria) {
      const layer = wktToLayer(geometria);
      if (layer) {
        // Asegurarse de que no sea ignorada por Geoman
        (layer as any).options.pmIgnore = false;
        setActiveLayer(layer);

        // Zoom a la geometría
        if (layer instanceof L.Circle) {
          map.fitBounds(layer.getBounds(), { padding: [50, 50] });
        } else if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
          const bounds = (layer as L.Polygon | L.Polyline).getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      }
    }

    // ── Auto-start: Iniciar modo dibujo automáticamente ──
    if (autoStartDraw && !geometria) {
      const shape = shapeMap[tipo];
      setTimeout(() => {
        map.pm.enableDraw(shape, {
          snappable: true,
          snapDistance: 15,
          allowSelfIntersection: false,
          pathOptions: ACTIVE_SHAPE_STYLE,
        });
      }, isInitializedRef.current ? 200 : 500);
    }
    isInitializedRef.current = true;

    // ── Evento map: forma creada ──
    const onCreated = (e: any) => {
      const { layer } = e;

      // Solo 1 geometría a la vez: reemplazar la anterior
      if (activeLayerRef.current && activeLayerRef.current !== layer) {
        detachLayerListeners();
        map.removeLayer(activeLayerRef.current);
      }

      activeLayerRef.current = layer;

      // Asegurar que sea editable por Geoman
      (layer as any).options.pmIgnore = false;
      L.PM.reInitLayer(layer);

      // Conectar listeners
      attachLayerListeners(layer);

      emitWkt(layer);
    };

    // ── Evento map: forma eliminada vía RemovalMode ──
    const onRemove = (e: any) => {
      const { layer } = e;
      if (layer === activeLayerRef.current) {
        detachLayerListeners();
        activeLayerRef.current = null;
        onChangeRef.current('');
      }
    };

    map.on('pm:create', onCreated);
    map.on('pm:remove', onRemove);

    // ── Cleanup ──
    return () => {
      map.pm.disableDraw();
      map.pm.disableGlobalEditMode();
      map.pm.disableGlobalDragMode();
      map.pm.removeControls();

      map.off('pm:create', onCreated);
      map.off('pm:remove', onRemove);

      detachLayerListeners();
      clearActiveLayer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, tipo, geometria, autoStartDraw]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  ExistingGeofencesLayer – Geozonas read-only con bordes punteados   */
/* ------------------------------------------------------------------ */

function ExistingGeofencesLayer({ geofences }: { geofences: GeofenceDto[] }) {
  const items = useMemo(() => {
    return geofences
      .map((g, i) => {
        const geometry = parseTraccarGeometry(g.geometria);
        const color = GEOFENCE_COLORS[i % GEOFENCE_COLORS.length];
        return geometry ? { geofence: g, geometry, color } : null;
      })
      .filter(Boolean) as Array<{
      geofence: GeofenceDto;
      geometry: NonNullable<ReturnType<typeof parseTraccarGeometry>>;
      color: string;
    }>;
  }, [geofences]);

  return (
    <>
      {items.map(({ geofence, geometry, color }) => {
        const readOnlyOptions: L.PathOptions = {
          color,
          fillColor: color,
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '6,4',
        };

        const popup = (
          <Popup>
            <div className="min-w-[150px]">
              <div className="font-medium text-sm">{geofence.nombre}</div>
              {geofence.descripcion && (
                <div className="text-xs text-gray-500 mt-1">{geofence.descripcion}</div>
              )}
            </div>
          </Popup>
        );

        if (geometry.type === 'circle') {
          const data = geometry.coordinates as { center: LatLngExpression; radius: number };
          return (
            <Circle
              key={geofence.id}
              center={data.center}
              radius={data.radius}
              pathOptions={readOnlyOptions}
              pmIgnore
            >
              {popup}
            </Circle>
          );
        }
        if (geometry.type === 'polygon') {
          return (
            <Polygon
              key={geofence.id}
              positions={geometry.coordinates as LatLngExpression[]}
              pathOptions={readOnlyOptions}
              pmIgnore
            >
              {popup}
            </Polygon>
          );
        }
        if (geometry.type === 'linestring') {
          return (
            <Polyline
              key={geofence.id}
              positions={geometry.coordinates as LatLngExpression[]}
              pathOptions={readOnlyOptions}
              pmIgnore
            >
              {popup}
            </Polyline>
          );
        }
        return null;
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  FitBoundsOnLoad                                                    */
/* ------------------------------------------------------------------ */

function FitBoundsOnLoad({
  existingGeofences,
  editGeometria,
}: {
  existingGeofences: GeofenceDto[];
  editGeometria?: string;
}) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (hasFitted.current) return;
    if (existingGeofences.length === 0 && !editGeometria) return;

    hasFitted.current = true;
    const bounds = L.latLngBounds([]);

    existingGeofences.forEach((g) => {
      const geo = parseTraccarGeometry(g.geometria);
      if (!geo) return;
      if (geo.type === 'circle') {
        const d = geo.coordinates as { center: LatLngExpression; radius: number };
        bounds.extend(L.latLng(d.center as [number, number]));
      } else if (geo.type === 'polygon' || geo.type === 'linestring') {
        (geo.coordinates as LatLngExpression[]).forEach((c) =>
          bounds.extend(c as [number, number]),
        );
      }
    });

    if (editGeometria) {
      const geo = parseTraccarGeometry(editGeometria);
      if (geo) {
        if (geo.type === 'circle') {
          const d = geo.coordinates as { center: LatLngExpression; radius: number };
          bounds.extend(L.latLng(d.center as [number, number]));
        } else if (geo.type === 'polygon' || geo.type === 'linestring') {
          (geo.coordinates as LatLngExpression[]).forEach((c) =>
            bounds.extend(c as [number, number]),
          );
        }
      }
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [existingGeofences, editGeometria, map]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  MapResizeHandler                                                   */
/* ------------------------------------------------------------------ */

function MapResizeHandler() {
  const { isCollapsed } = useMapShellContext();
  const map = useMap();

  useEffect(() => {
    const timers = [100, 300, 500].map((d) =>
      setTimeout(() => map.invalidateSize(), d),
    );
    return () => timers.forEach(clearTimeout);
  }, [isCollapsed, map]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                               */
/* ------------------------------------------------------------------ */

export function GeofenceEditorMap({
  tipo,
  geometria,
  onGeometriaChange,
  autoStartDraw = false,
  existingGeofences,
}: GeofenceEditorMapProps) {
  // Inyectar estilos de Geoman
  useEffect(() => {
    const id = 'geofence-geoman-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = GEOMAN_STYLES;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(id);
      if (el) document.head.removeChild(el);
    };
  }, []);

  return (
    <div className="geofence-editor-map h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ExistingGeofencesLayer geofences={existingGeofences} />

        <GeomanController
          tipo={tipo}
          geometria={geometria}
          onGeometriaChange={onGeometriaChange}
          autoStartDraw={autoStartDraw}
        />

        <FitBoundsOnLoad
          existingGeofences={existingGeofences}
          editGeometria={geometria}
        />

        <MapResizeHandler />
      </MapContainer>
    </div>
  );
}
