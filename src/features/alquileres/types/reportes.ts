// Enums alineados con backend

export enum AgrupacionPeriodo {
  Dia = 1,
  Semana = 2,
  Mes = 3,
}

export enum TipoReporte {
  UtilizacionFlota = 1,
  Ingresos = 2,
  EstadisticasReservas = 3,
  TopVehiculos = 4,
}

export enum FormatoExportacion {
  Excel = 1,
  Csv = 2,
}

export enum OrdenTopVehiculos {
  MasAlquilados = 1,
  MasRentables = 2,
}

export interface AlquilerDashboardKpiDto {
  reservasTotales: number;
  reservasConfirmadas: number;
  reservasEnCurso: number;
  reservasCanceladas: number;
  reservasTentativas: number;
  ingresosTotales: number;
  ingresosDelMes: number;
  vehiculosTotales: number;
  vehiculosDisponibles: number;
  vehiculosEnAlquiler: number;
  tasaOcupacion: number;
  clientesTotales: number;
  clientesNuevosDelMes: number;
  checkOutsDelMes: number;
  checkInsDelMes: number;
  recargosTotalesDelMes: number;
}

// =====================================================
// Utilizacion de flota
// =====================================================

export interface UtilizacionFlotaItemDto {
  vehiculoAlquilerId: string | null;
  vehiculoInfo: string | null;
  categoria: number | null;
  totalDias: number;
  diasAlquilados: number;
  diasDisponibles: number;
  porcentajeOcupacion: number;
  totalReservas: number;
}

export interface UtilizacionFlotaDto {
  fechaInicio: string;
  fechaFin: string;
  porVehiculo: UtilizacionFlotaItemDto[];
  porCategoria: UtilizacionFlotaItemDto[];
  porcentajeOcupacionGlobal: number;
  totalVehiculos: number;
}

// =====================================================
// Ingresos
// =====================================================

export interface IngresosPeriodoItemDto {
  periodo: string;
  periodoLabel: string;
  ingresos: number;
  cantidadReservas: number;
}

export interface IngresosSucursalItemDto {
  sucursalId: string;
  sucursalNombre: string;
  ingresos: number;
  cantidadReservas: number;
}

export interface IngresosCategoriaItemDto {
  categoria: number;
  ingresos: number;
  cantidadReservas: number;
}

export interface IngresosVehiculoItemDto {
  vehiculoAlquilerId: string;
  vehiculoInfo: string;
  ingresos: number;
  cantidadReservas: number;
}

export interface IngresosDto {
  fechaInicio: string;
  fechaFin: string;
  agrupacion: AgrupacionPeriodo;
  ingresosTotales: number;
  totalReservas: number;
  moneda: string;
  porPeriodo: IngresosPeriodoItemDto[];
  porVehiculo: IngresosVehiculoItemDto[];
  porSucursal: IngresosSucursalItemDto[];
  porCategoria: IngresosCategoriaItemDto[];
}

// =====================================================
// Estadisticas de reservas
// =====================================================

export interface ReservasPorEstadoDto {
  estado: number;
  cantidad: number;
  porcentaje: number;
}

export interface EstadisticasReservasDto {
  fechaInicio: string;
  fechaFin: string;
  totalReservas: number;
  tasaCancelacion: number;
  tasaNoShow: number;
  tasaCompletadas: number;
  duracionPromedioDias: number;
  revenuePromedio: number;
  revenueTotalPeriodo: number;
  porEstado: ReservasPorEstadoDto[];
}

// =====================================================
// Top vehiculos
// =====================================================

export interface TopVehiculoItemDto {
  vehiculoAlquilerId: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  categoria: number;
  totalAlquileres: number;
  revenueTotalGenerado: number;
  porcentajeOcupacion: number;
}

export interface TopVehiculosDto {
  fechaInicio: string;
  fechaFin: string;
  ordenadoPor: OrdenTopVehiculos;
  top: number;
  vehiculos: TopVehiculoItemDto[];
}

// =====================================================
// Exportar reporte
// =====================================================

export interface ExportarReporteParams {
  tipoReporte: TipoReporte;
  formato?: FormatoExportacion;
  fechaInicio: string;
  fechaFin: string;
  sucursalId?: string;
  categoria?: number;
  agrupacion?: AgrupacionPeriodo;
  top?: number;
  ordenarPor?: OrdenTopVehiculos;
}
