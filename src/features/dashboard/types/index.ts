export interface CerebroDashboardKpiDto {
  fechaDesdeUtc: string;
  fechaHastaUtc: string;
  vehiculosTotales: number;
  vehiculosConTelemetria: number;
  posicionesValidas: number;
  posicionesInvalidas: number;
  distanciaTotalKm: number;
  velocidadPromedioKmh: number;
  velocidadMaximaKmh: number;
  tiempoMovimientoMinutos: number;
  tiempoDetenidoMinutos: number;
  alertasGeneradas: number;
  lecturasObd2: number;
  ultimoPaqueteUtc: string | null;
}

export interface AlertaCerebroDto {
  id: string;
  reglaAlertaId: string | null;
  nombreRegla: string | null;
  vehiculoId: string | null;
  patente: string | null;
  dispositivoId: string | null;
  geofenceId: string | null;
  nombreGeofence: string | null;
  tipo: TipoReglaAlerta;
  severidad: TipoNotificacion;
  estado: EstadoAlertaCerebro;
  titulo: string;
  mensaje: string;
  timestampEvento: string;
  latitud: number | null;
  longitud: number | null;
  metadataJson: string | null;
  fechaLectura: string | null;
  fechaResolucion: string | null;
  notaResolucion: string | null;
  fechaCreacion: string;
}

export enum TipoReglaAlerta {
  VelocidadMaxima = 1,
  DetencionExcesiva = 2,
  EntradaGeocerca = 3,
  SalidaGeocerca = 4,
  Desconexion = 5,
  RpmFueraDeRango = 6,
  TemperaturaMotorAlta = 7,
  BateriaBaja = 8,
}

export enum TipoNotificacion {
  Info = 1,
  Success = 2,
  Warning = 3,
  Error = 4,
  SystemAlert = 5,
}

export enum EstadoAlertaCerebro {
  Activa = 1,
  Reconocida = 2,
  Resuelta = 3,
  Descartada = 4,
}

export interface ListaPaginada<T> {
  items: T[];
  paginaActual: number;
  totalPaginas: number;
  tamanoPagina: number;
  totalRegistros: number;
  estadisticas?: Record<string, number>;
}

export interface DashboardKpisParams {
  fechaDesdeUtc?: string;
  fechaHastaUtc?: string;
}

export interface AlertasParams {
  numeroPagina?: number;
  tamanoPagina?: number;
  ordenarPor?: string;
  descendente?: boolean;
  tipo?: TipoReglaAlerta;
  severidad?: TipoNotificacion;
  estado?: EstadoAlertaCerebro;
  vehiculoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  soloNoLeidas?: boolean;
}
