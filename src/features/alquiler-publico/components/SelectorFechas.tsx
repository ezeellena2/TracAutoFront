import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui';
import { formatDateForInput } from '@/shared/utils/dateFormatter';
import type { HorarioSucursalDto } from '@/features/alquileres/types/sucursal';

interface SelectorFechasProps {
  fechaRecogida: string;
  fechaDevolucion: string;
  onChange: (campo: 'fechaRecogida' | 'fechaDevolucion', valor: string) => void;
  errors: Record<string, string>;
  horarioHelper?: string;
}

/**
 * Valida si una fecha/hora cae dentro del horario de una sucursal.
 * @returns null si es válido, o un string de error si no.
 */
export function validarHorarioSucursal(
  fechaHora: string,
  horarios: HorarioSucursalDto[],
  t: (key: string, opts?: Record<string, string>) => string,
): string | null {
  if (!fechaHora) return null;

  const date = new Date(fechaHora);
  if (isNaN(date.getTime())) return null;

  // DayOfWeek de JS: 0=Domingo..6=Sabado (coincide con backend)
  const diaSemana = date.getDay();
  const horario = horarios.find(h => h.diaSemana === diaSemana);

  if (!horario) return null; // Sin horario definido → no validar

  if (horario.cerrado) {
    return t('alquilerPublico.validacion.sucursalCerrada');
  }

  // Comparar hora seleccionada vs horario de la sucursal
  const horaStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
  if (horaStr < horario.horaApertura || horaStr > horario.horaCierre) {
    const apertura = horario.horaApertura.substring(0, 5);
    const cierre = horario.horaCierre.substring(0, 5);
    return t('alquilerPublico.validacion.fueraDeHorario', { apertura, cierre });
  }

  return null;
}

export function SelectorFechas({
  fechaRecogida,
  fechaDevolucion,
  onChange,
  errors,
  horarioHelper,
}: SelectorFechasProps) {
  const { t } = useTranslation();

  const ahora = formatDateForInput(new Date());

  const handleChange = useCallback(
    (campo: 'fechaRecogida' | 'fechaDevolucion') =>
      (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }) => {
        onChange(campo, e.target.value);
      },
    [onChange]
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('alquilerPublico.buscador.fechaRecogida')}
          type="datetime-local"
          name="fechaRecogida"
          value={fechaRecogida}
          onChange={handleChange('fechaRecogida')}
          min={ahora}
          error={errors.fechaRecogida}
          required
        />
        <Input
          label={t('alquilerPublico.buscador.fechaDevolucion')}
          type="datetime-local"
          name="fechaDevolucion"
          value={fechaDevolucion}
          onChange={handleChange('fechaDevolucion')}
          min={fechaRecogida || ahora}
          error={errors.fechaDevolucion}
          required
        />
      </div>
      {horarioHelper && (
        <p className="mt-1.5 text-xs text-text-muted">
          {t('alquilerPublico.buscador.horarioSucursal', { horario: horarioHelper })}
        </p>
      )}
    </div>
  );
}
