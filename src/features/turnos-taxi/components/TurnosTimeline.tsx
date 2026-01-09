/**
 * Timeline visual semanal para turnos de taxi
 * Muestra los turnos en formato calendario semanal con horas
 */

import { useMemo } from 'react';

import { DIAS_ORDEN, DIAS_LABELS_CORTOS, DIAS_LABELS_LARGOS, calculaCruzaMedianoche } from '../types';
import type { TurnoTaxiDto, DiaSemana } from '../types';

interface TurnosTimelineProps {
  turnos: TurnoTaxiDto[];
  onTurnoClick?: (turno: TurnoTaxiDto) => void;
  /** Hora actual para resaltar (formato "HH:mm") */
  horaActual?: string;
  /** Día actual (0-6) */
  diaActual?: DiaSemana;
  /** Altura de cada hora en píxeles */
  horaHeight?: number;
}

// Colores para diferentes vehículos
const VEHICLE_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-red-500',
];

export function TurnosTimeline({
  turnos,
  onTurnoClick,
  horaActual,
  diaActual,
  horaHeight = 40,
}: TurnosTimelineProps) {


  // Mapa de vehículo a color
  const vehiculoColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const vehiculoIds = [...new Set(turnos.map(t => t.vehiculoId))];
    vehiculoIds.forEach((id, index) => {
      map.set(id, VEHICLE_COLORS[index % VEHICLE_COLORS.length]);
    });
    return map;
  }, [turnos]);

  // Agrupar turnos por día
  const turnosPorDia = useMemo(() => {
    const result: Record<DiaSemana, TurnoTaxiDto[]> = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [],
    };

    turnos.forEach(turno => {
      turno.diasActivos.forEach(dia => {
        result[dia].push(turno);
      });
    });

    return result;
  }, [turnos]);

  // Horas del día (0-23)
  const horas = Array.from({ length: 24 }, (_, i) => i);

  // Convertir hora "HH:mm" a posición Y en píxeles
  const horaToY = (hora: string): number => {
    const [h, m] = hora.split(':').map(Number);
    return (h + m / 60) * horaHeight;
  };

  // Calcular altura de un turno
  const calcularAlturaTurno = (inicio: string, fin: string): number => {
    const [hI, mI] = inicio.split(':').map(Number);
    const [hF, mF] = fin.split(':').map(Number);

    let minutosInicio = hI * 60 + mI;
    let minutosFin = hF * 60 + mF;

    // Si cruza medianoche, el fin es al día siguiente
    if (minutosFin <= minutosInicio) {
      minutosFin += 24 * 60;
    }

    const duracionMinutos = minutosFin - minutosInicio;
    return (duracionMinutos / 60) * horaHeight;
  };

  // Línea de hora actual
  const lineaHoraActual = horaActual ? horaToY(horaActual) : null;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header con días */}
      <div className="flex border-b border-border">
        {/* Columna de horas */}
        <div className="w-16 flex-shrink-0 bg-background border-r border-border" />

        {/* Columnas de días */}
        {DIAS_ORDEN.map((dia) => (
          <div
            key={dia}
            className={`
              flex-1 py-3 text-center text-sm font-medium
              ${diaActual === dia
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted'
              }
            `}
          >
            <span className="hidden sm:inline">{DIAS_LABELS_LARGOS[dia]}</span>
            <span className="sm:hidden">{DIAS_LABELS_CORTOS[dia]}</span>
          </div>
        ))}
      </div>

      {/* Grid de horas y turnos */}
      <div className="flex relative" style={{ height: 24 * horaHeight }}>
        {/* Columna de horas */}
        <div className="w-16 flex-shrink-0 bg-background border-r border-border">
          {horas.map((hora) => (
            <div
              key={hora}
              className="text-xs text-text-muted text-right pr-2 -translate-y-1/2"
              style={{ height: horaHeight, paddingTop: horaHeight / 2 - 6 }}
            >
              {hora.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Columnas de días con turnos */}
        {DIAS_ORDEN.map((dia) => (
          <div
            key={dia}
            className={`
              flex-1 relative border-r border-border last:border-r-0
              ${diaActual === dia ? 'bg-primary/5' : ''}
            `}
          >
            {/* Líneas de horas */}
            {horas.map((hora) => (
              <div
                key={hora}
                className="absolute left-0 right-0 border-t border-border/50"
                style={{ top: hora * horaHeight }}
              />
            ))}

            {/* Turnos del día */}
            {turnosPorDia[dia].map((turno, index) => {
              const top = horaToY(turno.horaInicioLocal);
              const height = calcularAlturaTurno(turno.horaInicioLocal, turno.horaFinLocal);
              const color = vehiculoColorMap.get(turno.vehiculoId) || 'bg-gray-500';
              const cruzaMedianoche = calculaCruzaMedianoche(turno.horaInicioLocal, turno.horaFinLocal);

              // Si cruza medianoche, dividir en dos partes
              if (cruzaMedianoche) {
                const alturaHastaMedianoche = (24 * 60 - (parseInt(turno.horaInicioLocal.split(':')[0]) * 60 + parseInt(turno.horaInicioLocal.split(':')[1]))) / 60 * horaHeight;

                return (
                  <div key={turno.id}>
                    {/* Parte antes de medianoche */}
                    <button
                      className={`
                        absolute left-1 right-1 rounded text-white text-xs p-1 overflow-hidden
                        cursor-pointer hover:opacity-90 transition-opacity
                        ${color}
                      `}
                      style={{
                        top,
                        height: alturaHastaMedianoche,
                        zIndex: index + 1,
                      }}
                      onClick={() => onTurnoClick?.(turno)}
                      title={`${turno.nombre} (${turno.vehiculoPatente})`}
                    >
                      <div className="font-medium truncate">{turno.nombre}</div>
                      <div className="text-white/80 truncate text-[10px]">
                        {turno.horaInicioLocal} - 24:00
                      </div>
                    </button>

                    {/* Continuación al día siguiente (indicador) */}
                    <div
                      className={`absolute left-1 right-1 text-[10px] text-white/80 ${color} rounded-t px-1`}
                      style={{
                        top: 0,
                        height: 16,
                        zIndex: index + 1,
                      }}
                      title="Continúa del día anterior"
                    >
                      ⤴️ {turno.horaFinLocal}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={turno.id}
                  className={`
                    absolute left-1 right-1 rounded text-white text-xs p-1 overflow-hidden
                    cursor-pointer hover:opacity-90 transition-opacity
                    ${color}
                  `}
                  style={{
                    top,
                    height: Math.max(height, 24),
                    zIndex: index + 1,
                  }}
                  onClick={() => onTurnoClick?.(turno)}
                  title={`${turno.nombre} (${turno.vehiculoPatente})`}
                >
                  <div className="font-medium truncate">{turno.nombre}</div>
                  {height > 30 && (
                    <div className="text-white/80 truncate text-[10px]">
                      {turno.horaInicioLocal} - {turno.horaFinLocal}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}

        {/* Línea de hora actual */}
        {lineaHoraActual !== null && diaActual !== undefined && (
          <div
            className="absolute h-0.5 bg-red-500 z-50 pointer-events-none"
            style={{
              top: lineaHoraActual,
              left: `calc(4rem + ${DIAS_ORDEN.indexOf(diaActual)} * ((100% - 4rem) / 7))`,
              width: `calc((100% - 4rem) / 7)`,
            }}
          >
            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
          </div>
        )}
      </div>

      {/* Leyenda de vehículos */}
      <div className="p-3 border-t border-border bg-background">
        <div className="flex flex-wrap gap-3">
          {Array.from(vehiculoColorMap.entries()).map(([vehiculoId, color]) => {
            const turno = turnos.find(t => t.vehiculoId === vehiculoId);
            return (
              <div key={vehiculoId} className="flex items-center gap-2 text-xs">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-text-muted">{turno?.vehiculoPatente}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
