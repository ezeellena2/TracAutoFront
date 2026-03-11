import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { useLocalization } from '@/hooks/useLocalization';
import { EstadoReserva } from '../types/reserva';
import type { ReservaCalendarioDto } from '../types/reserva';

interface CalendarioReservasProps {
  reservas: ReservaCalendarioDto[];
  isLoading: boolean;
  mes: number;
  anio: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onReservaClick: (reserva: ReservaCalendarioDto) => void;
}

const ESTADO_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  [EstadoReserva.Tentativa]: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  [EstadoReserva.Confirmada]: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  [EstadoReserva.EnCurso]: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  [EstadoReserva.Completada]: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  [EstadoReserva.Cancelada]: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-300' },
  [EstadoReserva.NoShow]: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-400 border-dashed' },
};

const LEYENDA_ITEMS = [
  { estado: EstadoReserva.Tentativa, key: 'tentativa' },
  { estado: EstadoReserva.Confirmada, key: 'confirmada' },
  { estado: EstadoReserva.EnCurso, key: 'enCurso' },
  { estado: EstadoReserva.Completada, key: 'completada' },
  { estado: EstadoReserva.Cancelada, key: 'cancelada' },
  { estado: EstadoReserva.NoShow, key: 'noShow' },
];

export function CalendarioReservas({
  reservas,
  isLoading,
  mes,
  anio,
  onPrevMonth,
  onNextMonth,
  onReservaClick,
}: CalendarioReservasProps) {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();

  const totalDays = new Date(anio, mes, 0).getDate();
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const monthLabel = useMemo(() => {
    const date = new Date(anio, mes - 1, 1);
    return new Intl.DateTimeFormat(culture, { month: 'long', year: 'numeric', timeZone: timeZoneId }).format(date);
  }, [mes, anio, culture, timeZoneId]);

  // Agrupar reservas por vehículo y pre-computar mapa día → reserva (O(1) lookup)
  const vehiculoRows = useMemo(() => {
    const map = new Map<string, { label: string; reservas: ReservaCalendarioDto[] }>();

    for (const r of reservas) {
      const key = r.vehiculoAlquilerId ?? 'sin-vehiculo';
      const label = r.vehiculoDescripcion ?? t('alquileres.reservas.calendario.sinVehiculo');
      if (!map.has(key)) {
        map.set(key, { label, reservas: [] });
      }
      map.get(key)!.reservas.push(r);
    }

    return Array.from(map.entries()).map(([key, val]) => {
      const dayMap = new Map<number, ReservaCalendarioDto>();
      for (const r of val.reservas) {
        const desde = r.fechaHoraRecogida.split('T')[0];
        const hasta = r.fechaHoraDevolucion.split('T')[0];
        for (let d = 1; d <= totalDays; d++) {
          const dateStr = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          if (dateStr >= desde && dateStr <= hasta) {
            dayMap.set(d, r);
          }
        }
      }
      return {
        vehiculoKey: key,
        label: val.label,
        dayMap,
      };
    });
  }, [reservas, t, anio, mes, totalDays]);

  // Computar siempre fresco (sin useMemo[]) para que se actualice si la app queda abierta pasada la medianoche
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div>
      {/* Navegación de mes */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          aria-label={t('common.mesAnterior')}
          className="p-1.5 rounded-lg hover:bg-border text-text-muted hover:text-text transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-semibold text-text capitalize">{monthLabel}</span>
        <button
          onClick={onNextMonth}
          aria-label={t('common.mesSiguiente')}
          className="p-1.5 rounded-lg hover:bg-border text-text-muted hover:text-text transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : vehiculoRows.length === 0 ? (
        <div className="flex justify-center py-12 text-text-muted">
          {t('alquileres.reservas.calendario.sinReservas')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="sticky left-0 bg-surface z-10 text-left text-xs font-medium text-text-muted p-2 border-b border-border min-w-[160px]">
                  {t('alquileres.reservas.tabla.vehiculo')}
                </th>
                {days.map(day => {
                  const dateStr = `${anio}-${String(mes).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;
                  return (
                    <th
                      key={day}
                      className={`text-center text-xs font-medium p-1 border-b border-border min-w-[32px] ${
                        isToday ? 'bg-primary/10 text-primary' : 'text-text-muted'
                      }`}
                    >
                      {day}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {vehiculoRows.map(row => (
                <tr key={row.vehiculoKey} className="hover:bg-surface/50">
                  <td className="sticky left-0 bg-surface z-10 text-sm text-text p-2 border-b border-border truncate max-w-[160px]">
                    {row.label}
                  </td>
                  {days.map(day => {
                    const reserva = row.dayMap.get(day) ?? null;
                    if (!reserva) {
                      return (
                        <td key={day} className="p-0.5 border-b border-border">
                          <div className="h-6" />
                        </td>
                      );
                    }
                    const colors = ESTADO_COLORS[reserva.estado] ?? ESTADO_COLORS[EstadoReserva.Tentativa];
                    return (
                      <td key={day} className="p-0.5 border-b border-border">
                        <button
                          onClick={() => onReservaClick(reserva)}
                          className={`w-full h-6 rounded border ${colors.bg} ${colors.border} ${colors.text} text-[10px] leading-none cursor-pointer hover:opacity-80 transition-opacity`}
                          title={`${reserva.numeroReserva} — ${reserva.clienteNombreCompleto}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border">
        <span className="text-xs font-medium text-text-muted">{t('alquileres.reservas.calendario.leyenda')}:</span>
        {LEYENDA_ITEMS.map(item => {
          const colors = ESTADO_COLORS[item.estado];
          return (
            <div key={item.key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded border ${colors.bg} ${colors.border}`} />
              <span className="text-xs text-text-muted">
                {t(`alquileres.reservas.calendario.${item.key}`)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
