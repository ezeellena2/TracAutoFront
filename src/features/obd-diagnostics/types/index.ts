import type { ListaPaginada } from '@/features/dashboard/types';

export type { ListaPaginada };

export interface Obd2SnapshotDto {
  dispositivoId: string;
  vehiculoId: string | null;
  traccarPositionId: number | null;
  timestampDispositivo: string;
  timestampServidor: string;
  latitud: number;
  longitud: number;
  patente: string | null;
  aliasDispositivo: string | null;
  rpm: number | null;
  temperaturaMotorCelsius: number | null;
  voltajeBateria: number | null;
  nivelCombustiblePorcentaje: number | null;
  horasMotor: number | null;
  ignicionEncendida: boolean | null;
}

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

export interface VehiculoTelemetriaKpiDto {
  vehiculoId: string;
  patente: string;
  ultimaPosicionUtc: string | null;
  ultimaLatitud: number | null;
  ultimaLongitud: number | null;
  distanciaRecorridaKm: number;
  velocidadPromedioKmh: number;
  velocidadMaximaKmh: number;
  posicionesValidas: number;
  posicionesInvalidas: number;
  tiempoMovimientoMinutos: number;
  tiempoDetenidoMinutos: number;
  alertasGeneradas: number;
  lecturasObd2: number;
}

export interface Obd2HistoryParams {
  vehiculoId?: string;
  dispositivoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  numeroPagina?: number;
  tamanoPagina?: number;
}

export interface VehiculoTelemetriaParams {
  numeroPagina?: number;
  tamanoPagina?: number;
  ordenarPor?: string;
  descendente?: boolean;
  fechaDesdeUtc?: string;
  fechaHastaUtc?: string;
  vehiculoId?: string;
  soloConTelemetria?: boolean;
}
