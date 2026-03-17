export enum CadenciaResumenIA {
  Diario = 1,
  Semanal = 2,
  Mensual = 3,
}

export interface ConfiguracionResumenIADto {
  habilitado: boolean;
  cadencia: CadenciaResumenIA;
  horaEnvioUtc: number;
  diaSemana: number;
  diaMes: number;
  incluirMetricasFlota: boolean;
  incluirAlertas: boolean;
  incluirVehiculosOciosos: boolean;
  incluirConsumosCombustible: boolean;
  incluirAlquileres: boolean;
  emailsAdicionales: string | null;
}

export interface ResumenIADto {
  id: string;
  cadencia: CadenciaResumenIA;
  periodoDesde: string;
  periodoHasta: string;
  contenido: string;
  datosJson: string | null;
  tokensConsumidos: number;
  enviadoPorEmail: boolean;
  enviadoPorWhatsApp: boolean;
  fechaCreacion: string;
}

export interface ResumenIAListDto {
  resumenes: ResumenIADto[];
  total: number;
}

export type ActualizarConfiguracionRequest = Omit<ConfiguracionResumenIADto, never>;
