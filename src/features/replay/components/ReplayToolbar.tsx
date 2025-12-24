/**
 * ReplayToolbar component
 * Map style selector dropdown for replay page
 * Reuses the same dropdown pattern as MapToolbar
 */

import { useState, useRef, useEffect } from 'react';
import { Layers, Moon, Sun, Satellite, Map } from 'lucide-react';
import { MapStyle, MAP_TILES } from '@/features/traccar-map/types';

interface ReplayToolbarProps {
  mapStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
}

const STYLE_ICONS: Record<MapStyle, React.ReactNode> = {
  dark: <Moon size={16} />,
  light: <Sun size={16} />,
  satellite: <Satellite size={16} />,
  streets: <Map size={16} />,
};

export function ReplayToolbar({ mapStyle, onStyleChange }: ReplayToolbarProps) {
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
    onStyleChange(style);
    setIsStyleMenuOpen(false);
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex gap-2">
      {/* Map Style Selector */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-text hover:bg-background transition-all duration-200 shadow-lg"
          title="Tipo de mapa"
        >
          <Layers size={18} />
          <span className="text-sm font-medium hidden sm:inline">{MAP_TILES[mapStyle].label}</span>
        </button>
        
        {isStyleMenuOpen && (
          <div className="absolute top-full right-0 mt-2 w-40 bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
            {(Object.keys(MAP_TILES) as MapStyle[]).map((style) => (
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
                {MAP_TILES[style].label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
