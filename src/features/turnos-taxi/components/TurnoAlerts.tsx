/**
 * Componentes para mostrar alertas y mensajes UX relacionados con turnos
 * - Alerta de cruce de medianoche
 * - Alerta de solapamiento potencial
 * - Indicadores de estado
 */

import { useTranslation } from 'react-i18next';
import { AlertTriangle, Clock, Info } from 'lucide-react';

interface AlertBaseProps {
  className?: string;
}

/**
 * Alerta cuando un turno cruza medianoche
 */
export function AlertaCruceMedianoche({ className = '' }: AlertBaseProps) {
  const { t } = useTranslation();
  
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 ${className}`}>
      <Clock size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          {t('turnosTaxi.alertaCruceMedianoche')}
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
          {t('turnosTaxi.alertaCruceMedianocheDesc')}
        </p>
      </div>
    </div>
  );
}

/**
 * Alerta cuando se detecta un solapamiento potencial
 */
interface AlertaSolapamientoProps extends AlertBaseProps {
  turnosConflicto?: Array<{ nombre: string; horario: string }>;
}

export function AlertaSolapamiento({ turnosConflicto = [], className = '' }: AlertaSolapamientoProps) {
  const { t } = useTranslation();
  
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 ${className}`}>
      <AlertTriangle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          {t('turnosTaxi.alertaSolapamiento')}
        </p>
        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
          {t('turnosTaxi.alertaSolapamientoDesc')}
        </p>
        {turnosConflicto.length > 0 && (
          <ul className="mt-2 text-xs text-red-600 dark:text-red-400 space-y-1">
            {turnosConflicto.map((turno, i) => (
              <li key={i}>• {turno.nombre}: {turno.horario}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Información sobre días activos
 */
interface InfoDiasActivosProps extends AlertBaseProps {
  diasCount: number;
  cruzaMedianoche: boolean;
}

export function InfoDiasActivos({ diasCount, cruzaMedianoche, className = '' }: InfoDiasActivosProps) {
  const { t } = useTranslation();
  
  if (diasCount === 7 && !cruzaMedianoche) {
    return (
      <div className={`flex items-center gap-2 text-xs text-green-600 dark:text-green-400 ${className}`}>
        <Info size={14} />
        <span>{t('turnosTaxi.turnoTodosLosDias')}</span>
      </div>
    );
  }
  
  if (cruzaMedianoche) {
    return (
      <div className={`flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 ${className}`}>
        <Clock size={14} />
        <span>
          {t('turnosTaxi.turnoCruzaMedianocheInfo')}
        </span>
      </div>
    );
  }
  
  return null;
}

/**
 * Badge de estado para indicar si un turno está activo ahora
 */
interface TurnoStatusBadgeProps {
  estaActivoAhora: boolean;
  activo: boolean;
}

export function TurnoStatusBadge({ estaActivoAhora, activo }: TurnoStatusBadgeProps) {
  const { t } = useTranslation();
  
  if (!activo) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        {t('turnosTaxi.inactivo')}
      </span>
    );
  }
  
  if (estaActivoAhora) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        {t('turnosTaxi.enCurso')}
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
      {t('turnosTaxi.activo')}
    </span>
  );
}

/**
 * Tooltip con información resumida del turno
 */
interface TurnoTooltipContentProps {
  nombre: string;
  vehiculoPatente: string;
  horario: string;
  dias: string;
  geofencesCount: number;
  estaActivoAhora: boolean;
}

export function TurnoTooltipContent({
  nombre,
  vehiculoPatente,
  horario,
  dias,
  geofencesCount,
  estaActivoAhora,
}: TurnoTooltipContentProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-2 min-w-[200px]">
      <div className="flex items-center justify-between">
        <span className="font-medium">{nombre}</span>
        <TurnoStatusBadge estaActivoAhora={estaActivoAhora} activo={true} />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <div>🚗 {vehiculoPatente}</div>
        <div>⏰ {horario}</div>
        <div>📅 {dias}</div>
        {geofencesCount > 0 && (
          <div>📍 {geofencesCount} {t('turnosTaxi.zonas')}</div>
        )}
      </div>
    </div>
  );
}
