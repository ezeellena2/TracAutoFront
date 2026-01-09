/**
 * Filtros para la tabla de turnos de taxi
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui';
import type { TurnosFiltros } from '../types';

interface VehiculoOption {
  id: string;
  patente: string;
}

interface TurnosTaxiFiltersProps {
  filtros: TurnosFiltros;
  onFiltrosChange: (filtros: Partial<TurnosFiltros>) => void;
  vehiculos: VehiculoOption[];
  isLoadingVehiculos?: boolean;
}

export function TurnosTaxiFilters({
  filtros,
  onFiltrosChange,
  vehiculos,
  isLoadingVehiculos = false,
}: TurnosTaxiFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Búsqueda por nombre */}
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder={t('turnosTaxi.buscarPlaceholder', 'Buscar por nombre...')}
          value={filtros.buscar || ''}
          onChange={(e) => onFiltrosChange({ buscar: e.target.value || undefined })}
        />
      </div>

      {/* Filtro por vehículo */}
      <div className="w-48">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('turnosTaxi.vehiculo', 'Vehículo')}
        </label>
        <select
          value={filtros.vehiculoId || ''}
          onChange={(e) => onFiltrosChange({ vehiculoId: e.target.value || undefined })}
          disabled={isLoadingVehiculos}
          className="
            w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          <option value="">{t('turnosTaxi.todosVehiculos', 'Todos los vehículos')}</option>
          {vehiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.patente}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro por estado */}
      <div className="w-40">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('turnosTaxi.estado', 'Estado')}
        </label>
        <select
          value={filtros.soloActivos === undefined ? '' : filtros.soloActivos ? 'activos' : 'todos'}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              onFiltrosChange({ soloActivos: undefined });
            } else if (value === 'activos') {
              onFiltrosChange({ soloActivos: true });
            } else {
              onFiltrosChange({ soloActivos: false });
            }
          }}
          className="
            w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        >
          <option value="activos">{t('turnosTaxi.soloActivos', 'Solo activos')}</option>
          <option value="">{t('turnosTaxi.todos', 'Todos')}</option>
        </select>
      </div>
    </div>
  );
}
