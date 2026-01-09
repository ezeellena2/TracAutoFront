/**
 * Simulador de hora para preview de turnos activos
 * Permite "viajar en el tiempo" para ver qué turnos estarían activos
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/shared/ui';
import { DIAS_LABELS_LARGOS } from '../types';
import type { DiaSemana } from '../types';

interface SimuladorHoraProps {
  /** Callback cuando cambia la hora simulada */
  onHoraChange: (hora: string, dia: DiaSemana) => void;
  /** Si el simulador está activo */
  isActive: boolean;
  /** Callback para activar/desactivar */
  onActiveChange: (active: boolean) => void;
}

export function SimuladorHora({
  onHoraChange,
  isActive,
  onActiveChange,
}: SimuladorHoraProps) {
  const { t } = useTranslation();
  const [hora, setHora] = useState('12:00');
  const [dia, setDia] = useState<DiaSemana>(() => new Date().getDay() as DiaSemana);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // Minutos por tick

  // Obtener hora actual real
  const getHoraActual = useCallback(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }, []);

  const getDiaActual = useCallback((): DiaSemana => {
    return new Date().getDay() as DiaSemana;
  }, []);

  // Reset a hora actual
  const resetToNow = useCallback(() => {
    setHora(getHoraActual());
    setDia(getDiaActual());
    setIsPlaying(false);
  }, [getHoraActual, getDiaActual]);

  // Avanzar tiempo
  const avanzarTiempo = useCallback(() => {
    setHora(prevHora => {
      const [h, m] = prevHora.split(':').map(Number);
      let nuevoMinuto = m + speed;
      let nuevaHora = h;
      
      while (nuevoMinuto >= 60) {
        nuevoMinuto -= 60;
        nuevaHora++;
      }
      
      if (nuevaHora >= 24) {
        nuevaHora = 0;
        // Avanzar día
        setDia(prevDia => ((prevDia + 1) % 7) as DiaSemana);
      }
      
      return `${nuevaHora.toString().padStart(2, '0')}:${nuevoMinuto.toString().padStart(2, '0')}`;
    });
  }, [speed]);

  // Efecto para reproducción automática
  useEffect(() => {
    if (!isPlaying || !isActive) return;
    
    const interval = setInterval(avanzarTiempo, 1000 / speed);
    return () => clearInterval(interval);
  }, [isPlaying, isActive, avanzarTiempo, speed]);

  // Notificar cambios
  useEffect(() => {
    if (isActive) {
      onHoraChange(hora, dia);
    }
  }, [hora, dia, isActive, onHoraChange]);

  // Cuando se desactiva, notificar hora actual
  useEffect(() => {
    if (!isActive) {
      onHoraChange(getHoraActual(), getDiaActual());
    }
  }, [isActive, onHoraChange, getHoraActual, getDiaActual]);

  if (!isActive) {
    return (
      <button
        onClick={() => onActiveChange(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-surface border border-border rounded-lg hover:bg-background transition-colors"
      >
        <Clock size={16} className="text-text-muted" />
        <span className="text-text-muted">
          {t('turnosTaxi.simuladorHora', 'Simulador de hora')}
        </span>
      </button>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text flex items-center gap-2">
          <Clock size={16} className="text-primary" />
          {t('turnosTaxi.simuladorHora', 'Simulador de hora')}
        </h3>
        <button
          onClick={() => {
            onActiveChange(false);
            setIsPlaying(false);
          }}
          className="text-xs text-text-muted hover:text-text"
        >
          ✕ {t('common.close', 'Cerrar')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Selector de día */}
        <div>
          <label className="block text-xs text-text-muted mb-1">
            {t('turnosTaxi.dia', 'Día')}
          </label>
          <select
            value={dia}
            onChange={(e) => setDia(Number(e.target.value) as DiaSemana)}
            className="px-3 py-2 rounded border border-border bg-background text-text text-sm"
          >
            {([0, 1, 2, 3, 4, 5, 6] as DiaSemana[]).map((d) => (
              <option key={d} value={d}>
                {DIAS_LABELS_LARGOS[d]}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de hora */}
        <div>
          <label className="block text-xs text-text-muted mb-1">
            {t('turnosTaxi.hora', 'Hora')}
          </label>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="px-3 py-2 rounded border border-border bg-background text-text text-sm font-mono"
          />
        </div>

        {/* Velocidad */}
        <div>
          <label className="block text-xs text-text-muted mb-1">
            {t('turnosTaxi.velocidad', 'Velocidad')}
          </label>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="px-3 py-2 rounded border border-border bg-background text-text text-sm"
          >
            <option value={1}>1x</option>
            <option value={5}>5x</option>
            <option value={15}>15x</option>
            <option value={30}>30x</option>
            <option value={60}>60x</option>
          </select>
        </div>

        {/* Controles */}
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToNow}
            title={t('turnosTaxi.resetHoraActual', 'Volver a hora actual')}
          >
            <RotateCcw size={16} />
          </Button>
        </div>
      </div>

      {/* Indicador de hora simulada */}
      <div className="mt-3 px-3 py-2 bg-primary/10 rounded text-sm">
        <span className="text-primary font-medium">
          {t('turnosTaxi.horaSimulada', 'Hora simulada')}: {DIAS_LABELS_LARGOS[dia]} {hora}
        </span>
      </div>
    </div>
  );
}
