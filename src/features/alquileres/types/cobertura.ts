export interface CoberturaAlquilerDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioPorDia: number;
  deducibleMaximo: number;
  cubreRobo: boolean;
  cubreVidrios: boolean;
  cubreNeumaticos: boolean;
  cubreGranizo: boolean;
  obligatoria: boolean;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CreateCoberturaRequest {
  nombre: string;
  descripcion: string | null;
  precioPorDia: number;
  deducibleMaximo: number;
  cubreRobo: boolean;
  cubreVidrios: boolean;
  cubreNeumaticos: boolean;
  cubreGranizo: boolean;
  obligatoria: boolean;
}

export interface UpdateCoberturaRequest extends CreateCoberturaRequest {
  id: string;
}
