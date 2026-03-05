import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/shared/ui';
import { EstadoReserva } from '../types/reserva';
import type { TimelineEntry } from '../types/reserva';

interface TimelineReservaProps {
  entries: TimelineEntry[];
}

const ESTADO_LABEL_KEY: Record<number, string> = {
  [EstadoReserva.Tentativa]: 'alquileres.reservaDetalle.timeline.creada',
  [EstadoReserva.Confirmada]: 'alquileres.reservaDetalle.timeline.confirmada',
  [EstadoReserva.EnCurso]: 'alquileres.reservaDetalle.timeline.enCurso',
  [EstadoReserva.Completada]: 'alquileres.reservaDetalle.timeline.completada',
  [EstadoReserva.Cancelada]: 'alquileres.reservaDetalle.timeline.cancelada',
  [EstadoReserva.NoShow]: 'alquileres.reservaDetalle.timeline.noShow',
};

export function TimelineReserva({ entries }: TimelineReservaProps) {
  const { t } = useTranslation();

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader title={t('alquileres.reservaDetalle.timeline.titulo')} />
      <div className="relative pl-6">
        {entries.map((entry, idx) => {
          const isLast = idx === entries.length - 1;
          const isPast = !entry.esActual && idx < entries.findIndex(e => e.esActual);
          const isCurrent = entry.esActual;

          let dotClass = 'bg-border';
          if (isPast) dotClass = 'bg-emerald-500';
          if (isCurrent) dotClass = 'bg-primary ring-4 ring-primary/20';

          let textClass = 'text-text-muted';
          if (isPast) textClass = 'text-text';
          if (isCurrent) textClass = 'text-text font-semibold';

          return (
            <div key={entry.estado} className="relative pb-6 last:pb-0">
              {/* Línea conectora */}
              {!isLast && (
                <div className="absolute left-[-17px] top-3 w-0.5 h-full bg-border" />
              )}
              {/* Marcador */}
              <div className={`absolute left-[-21px] top-1 w-3 h-3 rounded-full ${dotClass}`} />
              {/* Contenido */}
              <div className="ml-2">
                <p className={`text-sm ${textClass}`}>
                  {t(ESTADO_LABEL_KEY[entry.estado] ?? '')}
                </p>
                {entry.fecha && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(entry.fecha).toLocaleString()}
                  </p>
                )}
                {entry.descripcion && (
                  <p className="text-xs text-text-muted mt-0.5 italic">{entry.descripcion}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
