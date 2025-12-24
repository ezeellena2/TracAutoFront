import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Focus, Crosshair, Tag, Tags, Layers, Moon, Sun, Satellite, Map } from 'lucide-react';
import { useTraccarMapStore, useFilteredVehicles } from '../store/traccarMap.store';
import { MapStyle } from '../types';

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
  const { showLabels, toggleLabels, selectedVehicleId, mapStyle, setMapStyle } = useTraccarMapStore();
  const vehicles = useFilteredVehicles();
  
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsStyleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStyleChange = (style: MapStyle) => {
    setMapStyle(style);
    setIsStyleMenuOpen(false);
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex gap-2">
      {/* Map Style Selector */}
      <div className="relative" ref={menuRef}>
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

      {/* Toggle Labels Button */}
      <button
        onClick={toggleLabels}
        className={`
          flex items-center gap-2 px-3 py-2 border rounded-lg transition-all duration-200 shadow-lg
          ${showLabels 
            ? 'bg-primary border-primary text-white' 
            : 'bg-surface border-border text-text hover:bg-background'
          }
        `}
        title={showLabels ? t('map.hideLabels') : t('map.showLabels')}
      >
        {showLabels ? <Tag size={18} /> : <Tags size={18} />}
        <span className="text-sm font-medium hidden sm:inline">{t('map.labels')}</span>
      </button>
    </div>
  );
}
