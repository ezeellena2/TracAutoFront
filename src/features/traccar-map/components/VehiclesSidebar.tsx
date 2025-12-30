import { useTranslation } from 'react-i18next';
import { Search, Car, AlertTriangle, Moon } from 'lucide-react';
import { useTraccarMapStore, useFilteredVehicles } from '../store/traccarMap.store';
import { VehiclePosition } from '../types';

function formatLastUpdate(date: Date, t: (key: string, options?: { minutes?: number; hours?: number }) => string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return t('map.now');
  if (diffMins < 60) return t('map.minutesAgo', { minutes: diffMins });
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return t('map.hoursAgo', { hours: diffHours });
  
  return date.toLocaleDateString();
}

function getStatusIcon(estado: VehiclePosition['estado']) {
  switch (estado) {
    case 'online':
      return <Car size={16} className="text-success" />;
    case 'offline':
      return <Moon size={16} className="text-text-muted" />;
    case 'unknown':
    default:
      return <AlertTriangle size={16} className="text-warning" />;
  }
}

function getStatusColor(estado: VehiclePosition['estado']) {
  switch (estado) {
    case 'online':
      return 'bg-success/10 border-success/30';
    case 'offline':
      return 'bg-error/10 border-error/30'; // Red to match DevicesPage
    case 'unknown':
    default:
      return 'bg-warning/10 border-warning/30';
  }
}

export function VehiclesSidebar() {
  const { t } = useTranslation();
  const { searchText, setSearchText, selectedVehicleId, setSelectedVehicle } = useTraccarMapStore();
  const filteredVehicles = useFilteredVehicles();

  return (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text mb-3">{t('map.vehicles')}</h2>
        
        {/* Search Input */}
        <div className="relative">
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" 
          />
          <input
            type="text"
            placeholder={t('map.searchPlaceholder')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-border text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Vehicle List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted p-4">
            <Car size={48} className="mb-3 opacity-50" />
            <p className="text-center">
              {searchText ? t('map.noVehiclesFound') : t('map.noVehiclesAvailable')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
                className={`
                  w-full p-3 rounded-lg border transition-all duration-200 text-left
                  ${selectedVehicleId === vehicle.id 
                    ? 'bg-primary/20 border-primary ring-2 ring-primary/30' 
                    : `${getStatusColor(vehicle.estado)} hover:bg-background`
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getStatusIcon(vehicle.estado)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text truncate">
                      {vehicle.nombre}
                    </p>
                    <p className="text-sm text-text-muted">
                      {vehicle.imei}
                    </p>
                    {vehicle.patente && (
                      <p className="text-sm text-primary font-medium">
                        {vehicle.patente}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                      <span>{formatLastUpdate(vehicle.lastUpdate, t)}</span>
                      {vehicle.velocidad > 0 && (
                        <>
                          <span>•</span>
                          <span>{vehicle.velocidad} km/h</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div className="p-3 border-t border-border bg-background">
        <p className="text-xs text-text-muted text-center">
          {filteredVehicles.length} {filteredVehicles.length === 1 ? t('map.vehicle') : t('map.vehicles_plural')}
        </p>
      </div>
    </div>
  );
}
