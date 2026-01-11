/**
 * Selector de geofences vinculadas para asignar a un turno
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GeofenceVinculoDto } from '../types';

interface GeofenceSelectorProps {
  /** IDs de geofences seleccionadas */
  value: string[];
  /** Callback cuando cambia la selección */
  onChange: (ids: string[]) => void;
  /** Lista de geofences vinculadas disponibles */
  geofenceVinculos: GeofenceVinculoDto[];
  /** Si está cargando */
  isLoading: boolean;
  /** Callback para refrescar lista */
  onRefresh: () => void;
  /** Si está deshabilitado */
  disabled?: boolean;
}

export function GeofenceSelector({
  value,
  onChange,
  geofenceVinculos,
  isLoading,
  onRefresh,
  disabled = false,
}: GeofenceSelectorProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleGeofence = (id: string) => {
    if (disabled) return;
    
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(geofenceVinculos.filter(g => g.activo && !g.stale).map(g => g.id));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Filtrar solo activas y no stale
  const disponibles = geofenceVinculos.filter(g => g.activo && !g.stale);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('turnosTaxi.geofences')} 
          <span className="text-gray-400 font-normal ml-1">({t('common.opcional')})</span>
        </label>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          {t('common.cargando')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('turnosTaxi.geofences', 'Zonas geográficas')}
          <span className="text-gray-400 font-normal ml-1">({t('common.opcional', 'opcional')})</span>
        </label>
        
        <div className="flex items-center gap-2">
          {value.length > 0 && (
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {value.length} {t('turnosTaxi.seleccionadas', 'seleccionadas')}
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={disabled}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title={t('common.refrescar')}
          >
            🔄
          </button>
        </div>
      </div>

      {disponibles.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p>{t('turnosTaxi.sinGeofences', 'No hay zonas geográficas vinculadas')}</p>
          <p className="text-xs mt-1">
            {t('turnosTaxi.vincularDesdeTraccar', 'Vincule zonas desde la sección de Geofences')}
          </p>
        </div>
      ) : (
        <>
          {/* Lista colapsable */}
          <div className={`
            border rounded-lg overflow-hidden
            border-gray-200 dark:border-gray-700
          `}>
            {/* Header */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {value.length > 0 
                  ? t('common.zonesSelectedCount', { count: value.length, total: disponibles.length })
                  : `${disponibles.length} ${t('common.zonesAvailable')}`
                }
              </span>
              <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {/* Lista expandida */}
            {isExpanded && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-48 overflow-y-auto">
                {/* Acciones rápidas */}
                <div className="flex gap-2 px-3 py-2 bg-white dark:bg-gray-900">
                  <button
                    type="button"
                    onClick={selectAll}
                    disabled={disabled}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {t('common.seleccionarTodos')}
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={disabled}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    {t('common.limpiar')}
                  </button>
                </div>

                {/* Items */}
                {disponibles.map((geofence) => {
                  const isSelected = value.includes(geofence.id);
                  const nombre = geofence.alias || geofence.traccarNombre || `Geofence ${geofence.traccarGeofenceId}`;
                  
                  return (
                    <label
                      key={geofence.id}
                      className={`
                        flex items-center gap-3 px-3 py-2 cursor-pointer
                        hover:bg-gray-50 dark:hover:bg-gray-800
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleGeofence(geofence.id)}
                        disabled={disabled}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-900 dark:text-white truncate block">
                          {nombre}
                        </span>
                        {geofence.traccarDescripcion && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                            {geofence.traccarDescripcion}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
