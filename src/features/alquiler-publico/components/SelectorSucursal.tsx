import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, X, ChevronDown } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { SucursalPublicaDto } from '../types/busqueda';

// Fix default marker icons (patrón MapView.tsx)
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816]; // Buenos Aires

interface SelectorSucursalProps {
  sucursales: SucursalPublicaDto[];
  value: SucursalPublicaDto | null;
  onChange: (sucursal: SucursalPublicaDto | null) => void;
  label: string;
  error?: string;
  disabled?: boolean;
}

function buildSucursalIcon(color: string, size: number) {
  return L.divIcon({
    className: 'sucursal-marker',
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background-color: ${color}; border: 2px solid #fff;
        border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3" fill="${color}" stroke="white"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

const DEFAULT_MARKER_COLOR = '#6b7280';
const FALLBACK_PRIMARY = '#2563eb';

// Sub-componente para centrar mapa cuando cambia la selección
function MapCenterHandler({ sucursales, selected }: {
  sucursales: SucursalPublicaDto[];
  selected: SucursalPublicaDto | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selected?.latitud != null && selected?.longitud != null) {
      map.setView([selected.latitud, selected.longitud], 14, { animate: true });
      return;
    }

    const conCoords = sucursales.filter(s => s.latitud != null && s.longitud != null);
    if (conCoords.length > 0) {
      const bounds = L.latLngBounds(
        conCoords.map(s => [s.latitud!, s.longitud!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
    }
  }, [selected, sucursales, map]);

  return null;
}

export function SelectorSucursal({
  sucursales,
  value,
  onChange,
  label,
  error,
  disabled = false,
}: SelectorSucursalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoizar icons para evitar recrear L.divIcon en cada render (I1 + I2: usa CSS var de branding)
  const { selectedIcon, defaultIcon } = useMemo(() => {
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary').trim() || FALLBACK_PRIMARY;
    return {
      selectedIcon: buildSucursalIcon(primaryColor, 32),
      defaultIcon: buildSucursalIcon(DEFAULT_MARKER_COLOR, 26),
    };
  }, []);

  // Filtro de sucursales
  const filtradas = useMemo(() => {
    if (!query.trim()) return sucursales;
    const q = query.toLowerCase();
    return sucursales.filter(s =>
      s.nombre.toLowerCase().includes(q) ||
      s.ciudad.toLowerCase().includes(q) ||
      s.direccion.toLowerCase().includes(q)
    );
  }, [sucursales, query]);

  // Sucursales con coordenadas (para el mapa)
  const conCoordenadas = useMemo(
    () => sucursales.filter(s => s.latitud != null && s.longitud != null),
    [sucursales]
  );

  // Click-outside para cerrar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((sucursal: SucursalPublicaDto) => {
    onChange(sucursal);
    setQuery('');
    setIsOpen(false);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(null);
    setQuery('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  }, [isOpen]);

  const handleInputFocus = useCallback(() => {
    setIsOpen(true);
    setActiveIndex(-1);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < filtradas.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filtradas.length) {
          handleSelect(filtradas[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  }, [isOpen, filtradas, activeIndex, handleSelect]);

  return (
    <div ref={containerRef} className="relative">
      {/* Label */}
      <label className="block text-sm font-medium text-text mb-1.5">{label}</label>

      {/* Input combobox */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          <MapPin size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-label={label}
          aria-activedescendant={activeIndex >= 0 ? `sucursal-option-${activeIndex}` : undefined}
          value={isOpen ? query : (value ? `${value.nombre} — ${value.ciudad}` : '')}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={t('alquilerPublico.buscador.buscarSucursal')}
          disabled={disabled}
          className={`
            w-full pl-9 pr-16 py-2.5 rounded-lg border bg-surface text-text text-sm
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-error' : 'border-border'}
          `}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-text-muted hover:text-text rounded"
              aria-label={t('alquilerPublico.buscador.limpiarSeleccion')}
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Error */}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}

      {/* Panel dropdown + mapa */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-surface border border-border rounded-lg shadow-xl overflow-hidden animate-fade-in">
          {/* Lista de sucursales */}
          <div className="max-h-48 overflow-auto">
            {filtradas.length === 0 ? (
              <p className="px-4 py-3 text-sm text-text-muted">
                {t('alquilerPublico.buscador.sinSucursales')}
              </p>
            ) : (
              <ul role="listbox">
                {filtradas.map((s, idx) => (
                  <li
                    key={s.id}
                    id={`sucursal-option-${idx}`}
                    role="option"
                    aria-selected={value?.id === s.id}
                    onClick={() => handleSelect(s)}
                    className={`
                      px-4 py-2.5 cursor-pointer text-sm transition-colors
                      ${value?.id === s.id ? 'bg-primary/10 text-primary' : ''}
                      ${activeIndex === idx ? 'bg-primary/5 outline-none' : ''}
                      ${value?.id !== s.id && activeIndex !== idx ? 'text-text hover:bg-border/50' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{s.nombre}</p>
                        <p className="text-xs text-text-muted">{s.direccion}, {s.ciudad}</p>
                      </div>
                      {s.permiteOneWay && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {t('alquilerPublico.buscador.oneWay')}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mapa integrado */}
          {conCoordenadas.length > 0 && (
            <div className="border-t border-border h-48">
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={11}
                className="w-full h-full"
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
                <MapCenterHandler sucursales={conCoordenadas} selected={value} />
                {conCoordenadas.map(s => (
                  <Marker
                    key={s.id}
                    position={[s.latitud!, s.longitud!]}
                    icon={value?.id === s.id ? selectedIcon : defaultIcon}
                    eventHandlers={{ click: () => handleSelect(s) }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{s.nombre}</p>
                        <p className="text-text">{s.direccion}</p>
                        <p className="text-text-muted text-xs">{s.ciudad}, {s.provincia}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
