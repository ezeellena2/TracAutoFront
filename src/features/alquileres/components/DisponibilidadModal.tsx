import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, Spinner, ApiErrorBanner } from '@/shared/ui';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import { vehiculosAlquilerApi } from '@/services/endpoints';
import type { VehiculoAlquilerDto, DisponibilidadDiaDto } from '../types/vehiculoAlquiler';

interface DisponibilidadModalProps {
  isOpen: boolean;
  vehiculo: VehiculoAlquilerDto | null;
  onClose: () => void;
}

const DIAS_SEMANA_KEYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;

export function DisponibilidadModal({ isOpen, vehiculo, onClose }: DisponibilidadModalProps) {
  const { t, i18n } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadDiaDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<ParsedError | null>(null);

  // Reset mes al abrir con nuevo vehículo
  useEffect(() => {
    if (isOpen && vehiculo) {
      const n = new Date();
      setCurrentMonth(n.getMonth() + 1);
      setCurrentYear(n.getFullYear());
    }
  }, [isOpen, vehiculo]);

  // Cargar disponibilidad
  useEffect(() => {
    if (!isOpen || !vehiculo) return;
    setIsLoading(true);
    setApiError(null);
    vehiculosAlquilerApi.getDisponibilidad(vehiculo.id, { mes: currentMonth, anio: currentYear })
      .then(data => setDisponibilidad(data))
      .catch((err) => {
        const parsed = handleApiError(err, { showToast: false });
        setApiError(parsed);
        setDisponibilidad([]);
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, vehiculo, currentMonth, currentYear]);

  // Mapa fecha → ocupado
  const ocupadoMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    disponibilidad.forEach(d => { map[d.fecha] = d.ocupado; });
    return map;
  }, [disponibilidad]);

  // Generar grid del calendario
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const totalDays = lastDay.getDate();

    // Día de la semana del primer día (0=Dom, 1=Lun...)
    // Convertir a Lun=0, Mar=1, ..., Dom=6
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days: Array<{ day: number; dateStr: string } | null> = [];

    // Padding
    for (let i = 0; i < startDow; i++) {
      days.push(null);
    }

    // Días del mes
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(currentMonth).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      days.push({ day: d, dateStr: `${currentYear}-${mm}-${dd}` });
    }

    return days;
  }, [currentMonth, currentYear]);

  const monthLabel = useMemo(() => {
    const date = new Date(currentYear, currentMonth - 1, 1);
    const lang = i18n.language === 'es' ? 'es-AR' : 'en-US';
    return date.toLocaleDateString(lang, { month: 'long', year: 'numeric' });
  }, [currentMonth, currentYear, i18n.language]);

  const now2 = new Date();
  const todayStr = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}-${String(now2.getDate()).padStart(2, '0')}`;

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  if (!vehiculo) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-text">
            {t('alquileres.flota.disponibilidad.titulo', { patente: vehiculo.patente })}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        {/* Navegación de mes */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-border text-text-muted hover:text-text transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-text capitalize">{monthLabel}</span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-border text-text-muted hover:text-text transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {apiError && (
          <div className="mb-4">
            <ApiErrorBanner error={apiError} jiraLabel="Error Disponibilidad" />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <>
            {/* Headers días de semana */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DIAS_SEMANA_KEYS.map(dia => (
                <div key={dia} className="text-center text-xs font-medium text-text-muted py-1">
                  {t(`alquileres.sucursales.dias.${dia}`).substring(0, 3)}
                </div>
              ))}
            </div>

            {/* Grid del calendario */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }

                const isOcupado = ocupadoMap[cell.dateStr] === true;
                const isToday = cell.dateStr === todayStr;

                return (
                  <div
                    key={cell.dateStr}
                    className={`
                      aspect-square flex items-center justify-center rounded-lg text-sm
                      ${isOcupado
                        ? 'bg-error/15 text-error font-medium'
                        : 'bg-surface text-text'
                      }
                      ${isToday ? 'ring-2 ring-primary' : ''}
                    `}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-surface border border-border" />
                <span className="text-xs text-text-muted">{t('alquileres.flota.disponibilidad.libre')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-error/15" />
                <span className="text-xs text-text-muted">{t('alquileres.flota.disponibilidad.ocupado')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded ring-2 ring-primary" />
                <span className="text-xs text-text-muted">{t('alquileres.flota.disponibilidad.hoy')}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
