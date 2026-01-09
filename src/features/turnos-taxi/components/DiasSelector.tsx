/**
 * Selector visual de días de la semana (L-M-M-J-V-S-D)
 * Permite selección múltiple con visualización tipo "pill"
 */

import { useTranslation } from 'react-i18next';
import type { DiaSemana } from '../types';
import { DIAS_ORDEN, DIAS_LABELS_CORTOS, DIAS_LABELS_LARGOS } from '../types';

interface DiasSelectorProps {
  /** Días actualmente seleccionados */
  value: DiaSemana[];
  /** Callback cuando cambia la selección */
  onChange: (dias: DiaSemana[]) => void;
  /** Si está deshabilitado */
  disabled?: boolean;
  /** Tamaño de los botones */
  size?: 'sm' | 'md' | 'lg';
  /** Mostrar label "Días activos" */
  showLabel?: boolean;
  /** Clase adicional para el contenedor */
  className?: string;
}

export function DiasSelector({
  value,
  onChange,
  disabled = false,
  size = 'md',
  showLabel = true,
  className = '',
}: DiasSelectorProps) {
  const { t } = useTranslation();

  const toggleDia = (dia: DiaSemana) => {
    if (disabled) return;
    
    if (value.includes(dia)) {
      // Quitar día (solo si queda al menos uno)
      if (value.length > 1) {
        onChange(value.filter(d => d !== dia));
      }
    } else {
      // Agregar día
      onChange([...value, dia]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange([...DIAS_ORDEN]);
  };

  const selectWeekdays = () => {
    if (disabled) return;
    onChange([1, 2, 3, 4, 5]); // L-V
  };

  const selectWeekend = () => {
    if (disabled) return;
    onChange([6, 0]); // S-D
  };

  // Determinar clases según tamaño
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  const labelId = 'dias-selector-label';

  return (
    <div 
      className={`flex flex-col gap-2 ${className}`}
      role="group"
      aria-labelledby={showLabel ? labelId : undefined}
      aria-label={!showLabel ? t('turnosTaxi.diasActivos', 'Días activos') : undefined}
    >
      {showLabel && (
        <label 
          id={labelId}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t('turnosTaxi.diasActivos', 'Días activos')}
        </label>
      )}
      
      {/* Selector de días */}
      <div 
        className="flex items-center gap-1"
        role="listbox"
        aria-multiselectable="true"
        aria-label={t('turnosTaxi.seleccionarDias', 'Seleccionar días de la semana')}
      >
        {DIAS_ORDEN.map((dia) => {
          const isSelected = value.includes(dia);
          const isWeekend = dia === 0 || dia === 6;
          
          return (
            <button
              key={dia}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => toggleDia(dia)}
              disabled={disabled}
              title={DIAS_LABELS_LARGOS[dia]}
              aria-label={`${DIAS_LABELS_LARGOS[dia]}${isSelected ? ' - seleccionado' : ''}`}
              className={`
                ${sizeClasses[size]}
                rounded-full font-medium transition-all duration-150
                flex items-center justify-center
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${isSelected
                  ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                  : isWeekend
                    ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              `}
            >
              {DIAS_LABELS_CORTOS[dia]}
            </button>
          );
        })}
      </div>

      {/* Shortcuts */}
      {!disabled && (
        <div className="flex gap-2 text-xs" role="group" aria-label={t('turnosTaxi.atajosRapidos', 'Atajos rápidos')}>
          <button
            type="button"
            onClick={selectAll}
            aria-label={t('turnosTaxi.seleccionarTodos', 'Seleccionar todos los días')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:underline"
          >
            {t('turnosTaxi.todosDias', 'Todos')}
          </button>
          <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">|</span>
          <button
            type="button"
            onClick={selectWeekdays}
            aria-label={t('turnosTaxi.seleccionarLunesViernes', 'Seleccionar lunes a viernes')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:underline"
          >
            {t('turnosTaxi.lunesViernes', 'L-V')}
          </button>
          <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">|</span>
          <button
            type="button"
            onClick={selectWeekend}
            aria-label={t('turnosTaxi.seleccionarFinSemana', 'Seleccionar sábado y domingo')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:underline"
          >
            {t('turnosTaxi.finSemana', 'S-D')}
          </button>
        </div>
      )}
    </div>
  );
}
