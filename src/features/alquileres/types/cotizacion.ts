/**
 * Tipos para cotizacion de alquiler
 * Alineados con los DTOs del backend:
 *   ResultadoCotizacionDto, DetalleTarifaDto, DetalleRecargoDto,
 *   DetalleCoberturaDto, DetallePromocionDto
 */

export interface DetalleTarifaCotizacion {
  tarifaId: string | null;
  nombreTarifa: string;
  meses: number;
  precioMes: number | null;
  semanas: number;
  precioSemana: number | null;
  dias: number;
  precioDia: number | null;
  esFallback: boolean;
}

export interface DetalleRecargoCotizacion {
  recargoId: string;
  nombre: string;
  tipoRecargo: number;
  obligatorio: boolean;
  monto: number;
  detalleCalculo: string | null;
}

export interface DetalleCoberturaCotizacion {
  coberturaId: string;
  nombre: string;
  obligatoria: boolean;
  precioPorDia: number;
  dias: number;
  monto: number;
}

export interface DetallePromocionCotizacion {
  promocionId: string;
  codigo: string;
  tipoDescuento: number;
  valorDescuento: number;
  descuentoCalculado: number;
}

export interface ResultadoCotizacionDto {
  duracionDias: number;
  precioBase: number;
  detalleTarifa: DetalleTarifaCotizacion;
  recargos: DetalleRecargoCotizacion[];
  totalRecargos: number;
  coberturas: DetalleCoberturaCotizacion[];
  totalCoberturas: number;
  subtotal: number;
  promocion: DetallePromocionCotizacion | null;
  descuento: number;
  impuestosEstimados: number | null;
  precioTotal: number;
  depositoMinimo: number;
  moneda: string;
  usaFallbackVehiculo: boolean;
}
