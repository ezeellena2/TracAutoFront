export enum UnidadTiempoTarifa {
  Hora = 1,
  Dia = 2,
  Semana = 3,
  Mes = 4,
}

export interface TarifaAlquilerDto {
  id: string;
  nombre: string;
  categoriaAlquiler: number | null;
  sucursalId: string | null;
  sucursalNombre: string | null;
  unidadTiempo: number;
  precioPorUnidad: number;
  moneda: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  duracionMinimaDias: number | null;
  duracionMaximaDias: number | null;
  prioridad: number;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CreateTarifaRequest {
  nombre: string;
  categoriaAlquiler: number | null;
  sucursalId: string | null;
  unidadTiempo: number;
  precioPorUnidad: number;
  moneda: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  duracionMinimaDias: number | null;
  duracionMaximaDias: number | null;
  prioridad: number;
}

export interface UpdateTarifaRequest extends CreateTarifaRequest {
  id: string;
}
