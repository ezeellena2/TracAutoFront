import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Focus, Crosshair, Tag, Tags, Layers, Moon, Sun, Satellite, Map, Filter } from 'lucide-react';
import { useTraccarMapStore, useFilteredVehicles } from '../store/traccarMap.store';
import { MapStyle } from '../types';
import { LabelConfigMenu } from './LabelConfigMenu';
import { organizacionesApi } from '@/services/endpoints';
import { OrganizacionRelacionDto } from '@/shared/types/api';
import { useAuthStore } from '@/store';

interface MapToolbarProps {
  onCenterFleet: () => void;
  onCenterSelected: () => void;
}

const STYLE_ICONS: Record<MapStyle, React.ReactNode> = {
  dark: <Moon size={16} />,
  light: <Sun size={16} />,
  satellite: <Satellite size={16} />,
  streets: <Map size={16} />,
};

const MAP_STYLE_LABELS: Record<MapStyle, string> = {
  dark: 'map.dark',
  light: 'map.light',
  satellite: 'map.satellite',
  streets: 'map.streets',
};

export function MapToolbar({ onCenterFleet, onCenterSelected }: MapToolbarProps) {
  const { t } = useTranslation();
  const currentOrganizationId = useAuthStore((state) => state.organizationId);
  const {
    labelConfig,
    selectedVehicleId,
    mapStyle,
    setMapStyle,
    filterOrganizacionAsociadaId,
    setFilterOrganizacionAsociadaId,
    clearFilter
  } = useTraccarMapStore();
  const vehicles = useFilteredVehicles();

  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [isLabelMenuOpen, setIsLabelMenuOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [organizacionesRelacionadas, setOrganizacionesRelacionadas] = useState<OrganizacionRelacionDto[]>([]);

  const styleMenuRef = useRef<HTMLDivElement>(null);
  const labelMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Load organizaciones relacionadas on mount
  useEffect(() => {
    const loadOrganizaciones = async () => {
      try {
        const result = await organizacionesApi.listarRelacionesOrganizacion({
          numeroPagina: 1,
          tamanoPagina: 100,
          soloActivas: true,
        });
        setOrganizacionesRelacionadas(result.items);
      } catch (err) {
        console.error('Error loading organizaciones relacionadas:', err);
      }
    };
    loadOrganizaciones();
  }, [t]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (styleMenuRef.current && !styleMenuRef.current.contains(event.target as Node)) {
        setIsStyleMenuOpen(false);
      }
      if (labelMenuRef.current && !labelMenuRef.current.contains(event.target as Node)) {
        setIsLabelMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStyleChange = (style: MapStyle) => {
    setMapStyle(style);
    setIsStyleMenuOpen(false);
  };

  const handleFilterChange = (value: string | null) => {
    if (value === null) {
      clearFilter();
    } else {
      setFilterOrganizacionAsociadaId(value);
    }
    setIsFilterMenuOpen(false);
  };

  // Get current filter label
  const getFilterLabel = () => {
    if (filterOrganizacionAsociadaId === null) {
      return t('map.filter.all');
    }
    if (filterOrganizacionAsociadaId === 'own') {
      return t('map.filter.own');
    }
    const relacion = organizacionesRelacionadas.find(
      (r) => r.organizacionAId === filterOrganizacionAsociadaId || r.organizacionBId === filterOrganizacionAsociadaId
    );
    if (relacion && currentOrganizationId) {
      // Get the other organization name (the one that's not the current)
      const orgName = relacion.organizacionAId === currentOrganizationId
        ? relacion.organizacionBNombre
        : relacion.organizacionANombre;
      return orgName || t('map.filter.selectOrganization');
    }
    return t('map.filter.selectOrganization');
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex gap-2">
      {/* Organization Filter */}
      <div className="relative" ref={filterMenuRef}>
        <button
          onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all duration-200 shadow-lg ${filterOrganizacionAsociadaId !== null
            ? 'bg-primary border-primary text-white hover:bg-primary/90'
            : 'bg-surface border-border text-text hover:bg-background'
            }`}
          title={t('map.filter.title')}
        >
          <Filter size={18} className={filterOrganizacionAsociadaId !== null ? 'text-white' : ''} />
          <span className={`text-sm font-medium hidden sm:inline max-w-[120px] truncate ${filterOrganizacionAsociadaId !== null ? 'text-white' : ''
            }`}>
            {getFilterLabel()}
          </span>
        </button>

        {isFilterMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
            <button
              onClick={() => handleFilterChange(null)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${filterOrganizacionAsociadaId === null
                ? 'bg-primary text-white font-medium'
                : 'text-text hover:bg-background'
                }`}
            >
              {t('map.filter.all')}
            </button>
            <button
              onClick={() => handleFilterChange('own')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${filterOrganizacionAsociadaId === 'own'
                ? 'bg-primary text-white font-medium'
                : 'text-text hover:bg-background'
                }`}
            >
              {t('map.filter.own')}
            </button>
            {organizacionesRelacionadas.length > 0 && currentOrganizationId && (
              <>
                <div className="border-t border-border my-1" />
                {organizacionesRelacionadas.map((relacion) => {
                  // Determine which organization ID to use (the other one, not current)
                  const isA = relacion.organizacionAId === currentOrganizationId;
                  const orgId = isA ? relacion.organizacionBId : relacion.organizacionAId;
                  const orgName = isA ? relacion.organizacionBNombre : relacion.organizacionANombre;
                  return (
                    <button
                      key={relacion.id}
                      onClick={() => handleFilterChange(orgId)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${filterOrganizacionAsociadaId === orgId
                        ? 'bg-primary text-white font-medium'
                        : 'text-text hover:bg-background'
                        }`}
                    >
                      {orgName}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Map Style Selector */}
      <div className="relative" ref={styleMenuRef}>
        <button
          onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-text hover:bg-background transition-all duration-200 shadow-lg"
          title={t('map.mapType')}
        >
          <Layers size={18} />
          <span className="text-sm font-medium hidden sm:inline">{t(MAP_STYLE_LABELS[mapStyle])}</span>
        </button>

        {isStyleMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-40 bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
            {(Object.keys(MAP_STYLE_LABELS) as MapStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => handleStyleChange(style)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors
                  ${style === mapStyle
                    ? 'bg-primary/20 text-primary font-medium'
                    : 'text-text hover:bg-background'
                  }
                `}
              >
                {STYLE_ICONS[style]}
                {t(MAP_STYLE_LABELS[style])}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center Fleet Button */}
      <button
        onClick={onCenterFleet}
        disabled={vehicles.length === 0}
        className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-text hover:bg-background transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        title={t('map.centerFleet')}
      >
        <Focus size={18} />
        <span className="text-sm font-medium hidden sm:inline">{t('map.centerFleet')}</span>
      </button>

      {/* Center Selected Button */}
      <button
        onClick={onCenterSelected}
        disabled={!selectedVehicleId}
        className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-text hover:bg-background transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        title={t('map.centerSelected')}
      >
        <Crosshair size={18} />
        <span className="text-sm font-medium hidden sm:inline">{t('map.centerSelected')}</span>
      </button>

      {/* Labels Config Button */}
      <div className="relative" ref={labelMenuRef}>
        <button
          onClick={() => setIsLabelMenuOpen(!isLabelMenuOpen)}
          className={`
            flex items-center gap-2 px-3 py-2 border rounded-lg transition-all duration-200 shadow-lg
            ${labelConfig.enabled
              ? 'bg-primary border-primary text-white'
              : 'bg-surface border-border text-text hover:bg-background'
            }
          `}
          title={labelConfig.enabled ? t('map.hideLabels') : t('map.showLabels')}
        >
          {labelConfig.enabled ? <Tag size={18} /> : <Tags size={18} />}
          <span className="text-sm font-medium hidden sm:inline">{t('map.labels')}</span>
        </button>

        <LabelConfigMenu
          isOpen={isLabelMenuOpen}
          onClose={() => setIsLabelMenuOpen(false)}
        />
      </div>
    </div>
  );
}
