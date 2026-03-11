export enum TipoRecargo {
  ConductorAdicional = 1,
  GPS = 2,
  SillaBebe = 3,
  SeguroBasico = 4,
  SeguroPremium = 5,
  OneWay = 6,
  Combustible = 7,
  DevolucionTardia = 8,
  KmExcedente = 9,
  Otro = 99,
}

export interface RecargoAlquilerDto {
  id: string;
  tipoRecargo: number;
  nombre: string;
  descripcion: string | null;
  precioFijo: number | null;
  precioPorDia: number | null;
  porcentajeSobreTotal: number | null;
  obligatorio: boolean;
  categoriaAlquiler: number | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CreateRecargoRequest {
  tipoRecargo: number;
  nombre: string;
  descripcion: string | null;
  precioFijo: number | null;
  precioPorDia: number | null;
  porcentajeSobreTotal: number | null;
  obligatorio: boolean;
  categoriaAlquiler: number | null;
}

export interface UpdateRecargoRequest extends CreateRecargoRequest {
  id: string;
}
