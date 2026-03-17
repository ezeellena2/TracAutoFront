export enum TipoWidget {
  MapaFlota = 0,
  TrackingVehiculo = 1,
  EstadoReserva = 2,
  FlotaResumen = 3,
}

export interface WidgetConfiguracionDto {
  id: string;
  nombre: string;
  tipoWidget: TipoWidget;
  dominiosPermitidos: string[];
  configuracionVisualJson: string | null;
  activo: boolean;
  maxRequestsPorMinuto: number;
  totalAccesos: number;
  ultimoAcceso: string | null;
  fechaCreacion: string;
}

export interface WidgetConfiguracionConApiKeyDto extends WidgetConfiguracionDto {
  apiKey: string;
}

export interface CrearWidgetRequest {
  nombre: string;
  tipoWidget: TipoWidget;
  dominiosPermitidos: string[];
  configuracionVisualJson?: string | null;
  maxRequestsPorMinuto: number;
}

export interface ActualizarWidgetRequest {
  nombre: string;
  dominiosPermitidos: string[];
  configuracionVisualJson?: string | null;
  maxRequestsPorMinuto: number;
}
