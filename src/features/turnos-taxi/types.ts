/**
 * Tipos para el módulo de Turnos de Taxi
 */

// ============================================
// DÍAS DE LA SEMANA
// ============================================

/** Días de la semana (0=Domingo, 6=Sábado) */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Labels cortos para días (L-M-M-J-V-S-D) */
export const DIAS_LABELS_CORTOS: Record<DiaSemana, string> = {
  0: 'D',
  1: 'L',
  2: 'M',
  3: 'X',
  4: 'J',
  5: 'V',
  6: 'S',
};

/** Labels largos para días */
export const DIAS_LABELS_LARGOS: Record<DiaSemana, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

/** Orden de días para mostrar (L-M-M-J-V-S-D empezando por Lunes) */
export const DIAS_ORDEN: DiaSemana[] = [1, 2, 3, 4, 5, 6, 0];

// ============================================
// DTOs - GEOFENCE VINCULOS
// ============================================

/** Geofence vinculada a la organización */
export interface GeofenceVinculoDto {
  id: string;
  traccarGeofenceId: number;
  alias?: string;
  activo: boolean;
  stale: boolean;
  /** Nombre de la geofence en Traccar */
  traccarNombre?: string;
  /** Descripción de la geofence en Traccar */
  traccarDescripcion?: string;
  /** GeoJSON del área (desde Traccar) */
  areaGeoJson?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

/** Geofence disponible en Traccar para vincular */
export interface TraccarGeofenceDto {
  id: number;
  nombre: string;
  descripcion?: string;
  area?: string;
  /** Si ya está vinculada a la organización actual */
  yaVinculada: boolean;
}

// ============================================
// DTOs - TURNOS TAXI
// ============================================

/** Resumen de geofence para turno */
export interface GeofenceResumenDto {
  id: string;
  traccarGeofenceId: number;
  alias?: string;
  traccarNombre?: string;
}

/** Turno de taxi completo */
export interface TurnoTaxiDto {
  id: string;
  vehiculoId: string;
  vehiculoPatente: string;
  nombre: string;
  horaInicioLocal: string; // "HH:mm"
  horaFinLocal: string; // "HH:mm"
  diasActivos: DiaSemana[];
  cruzaMedianoche: boolean;
  activo: boolean;
  /** Calculado en el momento de la consulta */
  estaActivoAhora: boolean;
  geofences: GeofenceResumenDto[];
  fechaCreacion: string;
  fechaActualizacion: string;
}

/** Turno activo para visualización en mapa */
export interface TurnoActivoDto {
  id: string;
  vehiculoId: string;
  vehiculoPatente: string;
  nombre: string;
  horaInicioLocal: string;
  horaFinLocal: string;
  geofences: GeofenceGeoJsonDto[];
}

/** Geofence con geometría para renderizar en mapa */
export interface GeofenceGeoJsonDto {
  id: string;
  traccarGeofenceId: number;
  alias?: string;
  traccarNombre?: string;
  /** GeoJSON del área */
  areaGeoJson: string;
}

// ============================================
// COMMANDS
// ============================================

/** Crear nuevo turno */
export interface CreateTurnoTaxiCommand {
  vehiculoId: string;
  nombre: string;
  horaInicioLocal: string; // "HH:mm"
  horaFinLocal: string; // "HH:mm"
  diasActivos: DiaSemana[];
  geofenceIds?: string[];
}

/** Actualizar turno existente */
export interface UpdateTurnoTaxiCommand {
  id: string;
  nombre: string;
  horaInicioLocal: string;
  horaFinLocal: string;
  diasActivos: DiaSemana[];
  activo: boolean;
  geofenceIds?: string[];
}

/** Crear vínculo de geofence */
export interface CreateGeofenceVinculoCommand {
  traccarGeofenceId: number;
  alias?: string;
}

/** Actualizar vínculo de geofence */
export interface UpdateGeofenceVinculoCommand {
  id: string;
  alias?: string;
  activo: boolean;
}

// ============================================
// PARÁMETROS DE CONSULTA
// ============================================

/** Parámetros para listar turnos */
export interface ListTurnosTaxiParams {
  numeroPagina?: number;
  tamanoPagina?: number;
  vehiculoId?: string;
  vehiculoIds?: string[];
  soloActivos?: boolean;
  buscar?: string;
}

/** Parámetros para obtener turnos activos */
export interface GetTurnosActivosParams {
  vehiculoIds?: string[];
  atUtc?: string; // ISO date string
}

// ============================================
// UI STATE
// ============================================

/** Estado del modal de turno */
export interface TurnoModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  turno?: TurnoTaxiDto;
}

/** Filtros de la tabla de turnos */
export interface TurnosFiltros {
  vehiculoId?: string;
  soloActivos?: boolean;
  buscar?: string;
}

// ============================================
// HELPERS
// ============================================

/**
 * Formatea los días activos como texto legible
 * Ej: [1,2,3,4,5] -> "L-V" o "Lun a Vie"
 */
export function formatDiasActivos(dias: DiaSemana[], formato: 'corto' | 'largo' = 'corto'): string {
  if (dias.length === 0) return '-';
  if (dias.length === 7) return formato === 'corto' ? 'L-D' : 'Todos los días';
  
  const labels = formato === 'corto' ? DIAS_LABELS_CORTOS : DIAS_LABELS_LARGOS;
  
  // Detectar rangos consecutivos (considerando orden L-M-M-J-V-S-D)
  const sortedDias = [...dias].sort((a, b) => {
    const ordenA = DIAS_ORDEN.indexOf(a);
    const ordenB = DIAS_ORDEN.indexOf(b);
    return ordenA - ordenB;
  });
  
  // Detectar L-V (días laborables)
  if (sortedDias.length === 5 && 
      sortedDias.includes(1) && sortedDias.includes(2) && 
      sortedDias.includes(3) && sortedDias.includes(4) && sortedDias.includes(5)) {
    return formato === 'corto' ? 'L-V' : 'Lunes a Viernes';
  }
  
  // Para otros casos, mostrar días separados
  return sortedDias.map(d => labels[d]).join(formato === 'corto' ? '' : ', ');
}

/**
 * Formatea el rango horario
 * Ej: "08:00 - 18:00" o "20:00 - 06:00 (+1)"
 */
export function formatRangoHorario(inicio: string, fin: string, cruzaMedianoche: boolean): string {
  const suffix = cruzaMedianoche ? ' (+1)' : '';
  return `${inicio} - ${fin}${suffix}`;
}

/**
 * Determina si un turno cruza medianoche basado en horas
 */
export function calculaCruzaMedianoche(inicio: string, fin: string): boolean {
  const [hI, mI] = inicio.split(':').map(Number);
  const [hF, mF] = fin.split(':').map(Number);
  const minutosInicio = hI * 60 + mI;
  const minutosFin = hF * 60 + mF;
  return minutosFin <= minutosInicio;
}
