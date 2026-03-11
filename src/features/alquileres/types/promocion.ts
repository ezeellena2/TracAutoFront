export enum TipoDescuento {
  Porcentaje = 1,
  MontoFijo = 2,
}

export interface PromocionAlquilerDto {
  id: string;
  codigo: string;
  descripcion: string | null;
  tipoDescuento: number;
  valorDescuento: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
  usosMaximos: number | null;
  usosActuales: number;
  montoMinimoReserva: number | null;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ValidacionPromocionDto {
  esValida: boolean;
  descuentoCalculado: number;
  tipoDescuento: number;
  codigoPromocion: string;
  razonInvalidez: string | null;
  razonMetadata: Record<string, string> | null;
}

export interface CreatePromocionRequest {
  codigo: string;
  descripcion: string | null;
  tipoDescuento: number;
  valorDescuento: number;
  vigenciaDesde: string;
  vigenciaHasta: string;
  usosMaximos: number | null;
  montoMinimoReserva: number | null;
}

export interface UpdatePromocionRequest extends CreatePromocionRequest {
  id: string;
}
