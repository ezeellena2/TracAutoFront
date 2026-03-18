import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { useFeriadosResumen } from '@/hooks/useFeriadosResumen';

/**
 * Muestra el feriado de hoy o el próximo feriado.
 * Se usa dentro del dropdown del header.
 * Degrada sin romper: no renderiza nada si no hay datos o hay error.
 */
export function FeriadosHeader() {
  const { t } = useTranslation();
  const { resumen, isLoading } = useFeriadosResumen();

  if (isLoading) {
    return (
      <div className="h-6 w-full rounded-md bg-text-muted/10 animate-pulse" aria-hidden="true" />
    );
  }

  if (!resumen) return null;

  // Hoy es feriado — amber accent
  if (resumen.esHoyFeriado && resumen.hoyNombre) {
    return (
      <div
        className="flex items-start gap-1.5 px-2 py-1.5 rounded-md bg-amber-500/10 text-xs"
        role="status"
        aria-label={t('header.hoyFeriado', { nombre: resumen.hoyNombre })}
      >
        <Calendar size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <span className="font-medium text-amber-600 dark:text-amber-400 leading-snug">
          {t('header.hoyFeriado', { nombre: resumen.hoyNombre })}
        </span>
      </div>
    );
  }

  // Próximo feriado
  if (resumen.proximoFeriadoNombre && resumen.proximoFeriadoFecha) {
    const fechaFormateada = formatearFecha(resumen.proximoFeriadoFecha);

    return (
      <div
        className="flex items-start gap-1.5 px-2 py-1.5 rounded-md bg-text-muted/[0.06] text-xs"
        role="status"
        title={resumen.proximoFeriadoTipo ?? undefined}
        aria-label={t('header.proximoFeriado', {
          fecha: fechaFormateada,
          nombre: resumen.proximoFeriadoNombre,
        })}
      >
        <Calendar size={12} className="text-text-muted flex-shrink-0 mt-0.5" />
        <span className="text-text-muted leading-snug">
          {t('header.proximoFeriado', {
            fecha: fechaFormateada,
            nombre: resumen.proximoFeriadoNombre,
          })}
        </span>
      </div>
    );
  }

  return null;
}

/**
 * Formatea "2025-06-20" → "20 jun" en formato corto legible.
 */
function formatearFecha(fechaStr: string): string {
  try {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  } catch {
    return fechaStr;
  }
}
