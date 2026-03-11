// Enum alineado con backend: TracAuto.Domain.Enums.PoliticaCancelacion
export enum PoliticaCancelacion {
  Flexible = 1,
  Moderada = 2,
  Estricta = 3,
}

// DTO alineado con backend: ConfiguracionAlquilerDto
export interface ConfiguracionAlquilerDto {
  id: string;
  stripeAccountId: string | null;
  requiereSenalAlReservar: boolean;
  porcentajeSenal: number;
  politicaCancelacion: PoliticaCancelacion;
  diasAntesCancelacionGratis: number;
  porcentajePenalizacion: number;
  monedaPorDefecto: string;
  horasExpiracionTentativa: number;
  emailNotificacionReservas: string | null;
  precioPorLitroCombustible: number;
  precioPorHoraExtra: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// Request alineado con backend: UpdateConfiguracionAlquilerCommand
export interface UpdateConfiguracionAlquilerRequest {
  stripeAccountId: string | null;
  requiereSenalAlReservar: boolean;
  porcentajeSenal: number;
  politicaCancelacion: PoliticaCancelacion;
  diasAntesCancelacionGratis: number;
  porcentajePenalizacion: number;
  monedaPorDefecto: string;
  horasExpiracionTentativa: number;
  emailNotificacionReservas: string | null;
  precioPorLitroCombustible: number;
  precioPorHoraExtra: number;
}
