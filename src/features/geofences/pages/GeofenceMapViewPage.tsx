/**
 * Vista de mapa de todas las geozonas.
 * Usa MapShell (sidebar + mapa) para mostrar todas las geozonas
 * con un listado en el sidebar y todas visibles en el mapa.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import {
  ArrowLeft,
  MapPin,
  Search,
  Pencil,
  Eye,
  Loader2,
  Circle as CircleIcon,
  Hexagon,
  Minus,
} from 'lucide-react';

import { MapShell, useMapShellContext } from '@/features/traccar-map/components/MapShell';
import { geofencesApi } from '../api';
import { GEOFENCES_PAGE_SIZE } from '../types';
import type { GeofenceDto } from '../types';
import { TipoGeofence } from '../types';
import { parseTraccarGeometry } from '@/shared/utils/geometryParser';

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const DEFAULT_CENTER: L.LatLngExpression = [-34.6037, -58.3816];

const GEOFENCE_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
  '#ec4899', '#06b6d4', '#6366f1', '#ef4444',
];

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

function GeofenceMapSidebar({
  geofences,
  isLoading,
  selectedId,
  onSelect,
  onEdit,
  onBack,
}: {
  geofences: GeofenceDto[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (g: GeofenceDto) => void;
  onEdit: (g: GeofenceDto) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return geofences;
    const q = search.toLowerCase();
    return geofences.filter(
      (g) =>
        g.nombre.toLowerCase().includes(q) ||
        g.descripcion?.toLowerCase().includes(q),
    );
  }, [geofences, search]);

  const getTipoIcon = (tipo: TipoGeofence) => {
    switch (tipo) {
      case TipoGeofence.Polygon:
        return <Hexagon size={14} />;
      case TipoGeofence.Circle:
        return <CircleIcon size={14} />;
      case TipoGeofence.Polyline:
        return <Minus size={14} />;
    }
  };

  const getTipoLabel = (tipo: TipoGeofence) => {
    switch (tipo) {
      case TipoGeofence.Polygon:
        return t('geofences.tipo.polygon', 'Polígono');
      case TipoGeofence.Circle:
        return t('geofences.tipo.circle', 'Círculo');
      case TipoGeofence.Polyline:
        return t('geofences.tipo.polyline', 'Línea');
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-3"
        >
          <ArrowLeft size={16} />
          {t('geofences.volverALista', 'Volver a geozonas')}
        </button>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <MapPin size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text">
              {t('geofences.mapTitle', 'Mapa de Geozonas')}
            </h2>
            <p className="text-xs text-text-muted">
              {geofences.length} {geofences.length === 1 ? 'geozona' : 'geozonas'}
            </p>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('geofences.buscarGeozona', 'Buscar geozona...')}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <MapPin size={32} className="mb-2 opacity-50" />
            <p className="text-sm">
              {search
                ? t('geofences.sinResultados', 'Sin resultados')
                : t('geofences.sinGeofences', 'Sin geozonas')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((g, i) => {
              const color = GEOFENCE_COLORS[i % GEOFENCE_COLORS.length];
              const isSelected = selectedId === g.id;

              return (
                <div
                  key={g.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-primary/5 ${isSelected ? 'bg-primary/10' : ''
                    }`}
                  onClick={() => onSelect(g)}
                >
                  {/* Color indicator */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 border-2"
                    style={{ borderColor: color, backgroundColor: isSelected ? color : 'transparent' }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text truncate">{g.nombre}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-text-muted">{getTipoIcon(g.tipo)}</span>
                      <span className="text-xs text-text-muted">{getTipoLabel(g.tipo)}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(g);
                      }}
                      className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                      title={t('geofences.verEnMapa', 'Ver en mapa')}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(g);
                      }}
                      className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                      title={t('geofences.editarGeozona', 'Editar')}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GeofenceMapLayers – Todas las geozonas en el mapa                  */
/* ------------------------------------------------------------------ */

function GeofenceMapLayers({
  geofences,
  selectedId,
  onSelect,
}: {
  geofences: GeofenceDto[];
  selectedId: string | null;
  onSelect: (g: GeofenceDto) => void;
}) {
  const { t } = useTranslation();
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
        const isSelected = selectedId === geofence.id;
        const baseOptions: L.PathOptions = {
          color,
          fillColor: color,
          fillOpacity: isSelected ? 0.25 : 0.1,
          weight: isSelected ? 3 : 2,
        };

        const popup = (
          <Popup>
            <div className="min-w-[180px]">
              <div className="font-semibold text-sm mb-1">{geofence.nombre}</div>
              {geofence.descripcion && (
                <div className="text-xs text-gray-500 mb-2">{geofence.descripcion}</div>
              )}
              <button
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => onSelect(geofence)}
              >
                {t('geofences.enfocarEnMapa', 'Enfocar en mapa')}
              </button>
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
              pathOptions={baseOptions}
              eventHandlers={{ click: () => onSelect(geofence) }}
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
              pathOptions={baseOptions}
              eventHandlers={{ click: () => onSelect(geofence) }}
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
              pathOptions={{ ...baseOptions, fillOpacity: 0 }}
              eventHandlers={{ click: () => onSelect(geofence) }}
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
/*  FitAllBounds – Ajusta el mapa para mostrar todas las geozonas      */
/* ------------------------------------------------------------------ */

function FitAllBounds({ geofences }: { geofences: GeofenceDto[] }) {
  const map = useMap();
  const hasFitted = useState(false);

  useEffect(() => {
    if (hasFitted[0] || geofences.length === 0) return;
    hasFitted[1](true);

    const bounds = L.latLngBounds([]);
    geofences.forEach((g) => {
      const geo = parseTraccarGeometry(g.geometria);
      if (!geo) return;
      if (geo.type === 'circle') {
        const d = geo.coordinates as { center: LatLngExpression; radius: number };
        const center = L.latLng(d.center as [number, number]);
        bounds.extend(center);
        // Incluir el radio en los bounds
        bounds.extend(L.latLng(center.lat + d.radius / 111320, center.lng));
        bounds.extend(L.latLng(center.lat - d.radius / 111320, center.lng));
      } else if (geo.type === 'polygon' || geo.type === 'linestring') {
        (geo.coordinates as LatLngExpression[]).forEach((c) =>
          bounds.extend(c as [number, number]),
        );
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [geofences, map, hasFitted]);

  return null;
}

/* ------------------------------------------------------------------ */
/*  FlyToGeofence – Vuela a una geozona seleccionada                   */
/* ------------------------------------------------------------------ */

function FlyToGeofence({ geofence }: { geofence: GeofenceDto | null }) {
  const map = useMap();

  useEffect(() => {
    if (!geofence) return;
    const geo = parseTraccarGeometry(geofence.geometria);
    if (!geo) return;

    if (geo.type === 'circle') {
      const d = geo.coordinates as { center: LatLngExpression; radius: number };
      const center = L.latLng(d.center as [number, number]);
      const bounds = center.toBounds(d.radius * 2.5);
      map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
    } else if (geo.type === 'polygon' || geo.type === 'linestring') {
      const coords = geo.coordinates as LatLngExpression[];
      const bounds = L.latLngBounds(coords.map((c) => c as [number, number]));
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
      }
    }
  }, [geofence, map]);

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
/*  Mapa principal                                                     */
/* ------------------------------------------------------------------ */

function GeofenceMapView({
  geofences,
  selectedId,
  selectedGeofence,
  onSelect,
}: {
  geofences: GeofenceDto[];
  selectedId: string | null;
  selectedGeofence: GeofenceDto | null;
  onSelect: (g: GeofenceDto) => void;
}) {
  return (
    <div className="h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <GeofenceMapLayers
          geofences={geofences}
          selectedId={selectedId}
          onSelect={onSelect}
        />

        <FitAllBounds geofences={geofences} />
        <FlyToGeofence geofence={selectedGeofence} />
        <MapResizeHandler />
      </MapContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Página principal                                                   */
/* ------------------------------------------------------------------ */

export function GeofenceMapViewPage() {
  const navigate = useNavigate();
  const [geofences, setGeofences] = useState<GeofenceDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    geofencesApi
      .listar({ soloActivas: true, tamanoPagina: GEOFENCES_PAGE_SIZE })
      .then((result) => setGeofences(result.items))
      .catch((err) => console.error('Error loading geofences:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelect = useCallback((g: GeofenceDto) => {
    setSelectedId((prev) => (prev === g.id ? null : g.id));
  }, []);

  const handleEdit = useCallback(
    (g: GeofenceDto) => navigate(`/geozonas/${g.id}/editar`),
    [navigate],
  );

  const handleBack = useCallback(() => navigate('/geozonas'), [navigate]);

  const selectedGeofence = useMemo(
    () => geofences.find((g) => g.id === selectedId) ?? null,
    [geofences, selectedId],
  );

  return (
    <MapShell
      sidebar={
        <GeofenceMapSidebar
          geofences={geofences}
          isLoading={isLoading}
          selectedId={selectedId}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onBack={handleBack}
        />
      }
      map={
        <GeofenceMapView
          geofences={geofences}
          selectedId={selectedId}
          selectedGeofence={selectedGeofence}
          onSelect={handleSelect}
        />
      }
      itemCount={geofences.length}
      CollapsedIcon={MapPin}
    />
  );
}
