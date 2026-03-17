export enum PoliticaCancelacion {
  Flexible = 1,
  Moderada = 2,
  Estricta = 3,
}

export interface ConfiguracionAlquilerDto {
  id: string;
  enviarRecordatoriosRecogida: boolean;
  horasAnticipacionRecordatorioRecogida: number;
  enviarRecordatoriosDevolucion: boolean;
  horasAnticipacionRecordatorioDevolucion: number;
  enviarRecordatoriosVencimientoDocumentos: boolean;
  diasAnticipacionRecordatorioDocumentos: number[];
  enviarRecordatoriosVencimientoLicenciasClientes: boolean;
  enviarRecordatoriosVencimientoVtvVehiculos: boolean;
  enviarRecordatoriosVencimientoSeguroVehiculos: boolean;
  enviarRecordatoriosVencimientoPolizaVehiculos: boolean;
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
  enviarLinkTrackingAlConfirmar: boolean;
  duracionLinkTrackingHoras: number;
  alertarStockOciosoHabilitado: boolean;
  diasAnticipacionStockOcioso: number;
  umbralMinimoVehiculosOciosos: number;
  sugerenciaRotacionHabilitada: boolean;
  aniosFlotaParaRotarAMarketplace: number;
  kilometrajeLimiteParaRotarAMarketplace: number;
  diasPublicacionSinVentaParaRotarAAlquiler: number;
  ajusteAutomaticoTarifasHabilitado: boolean;
  indiceAjusteTarifas: string | null;
  porcentajeAjusteMaximo: number;
  diaDelMesAjuste: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface UpdateConfiguracionAlquilerRequest {
  enviarRecordatoriosRecogida: boolean;
  horasAnticipacionRecordatorioRecogida: number;
  enviarRecordatoriosDevolucion: boolean;
  horasAnticipacionRecordatorioDevolucion: number;
  enviarRecordatoriosVencimientoDocumentos: boolean;
  diasAnticipacionRecordatorioDocumentos: number[];
  enviarRecordatoriosVencimientoLicenciasClientes: boolean;
  enviarRecordatoriosVencimientoVtvVehiculos: boolean;
  enviarRecordatoriosVencimientoSeguroVehiculos: boolean;
  enviarRecordatoriosVencimientoPolizaVehiculos: boolean;
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
  enviarLinkTrackingAlConfirmar: boolean;
  duracionLinkTrackingHoras: number;
  alertarStockOciosoHabilitado: boolean;
  diasAnticipacionStockOcioso: number;
  umbralMinimoVehiculosOciosos: number;
  sugerenciaRotacionHabilitada: boolean;
  aniosFlotaParaRotarAMarketplace: number;
  kilometrajeLimiteParaRotarAMarketplace: number;
  diasPublicacionSinVentaParaRotarAAlquiler: number;
  ajusteAutomaticoTarifasHabilitado: boolean;
  indiceAjusteTarifas: string | null;
  porcentajeAjusteMaximo: number;
  diaDelMesAjuste: number;
}
