export enum TipoRespuestaCopiloto {
  Texto = 1,
  TablaResumen = 2,
  Kpi = 3,
  Accion = 4,
  Error = 5,
}

export enum RolMensajeCopiloto {
  Usuario = 1,
  Asistente = 2,
  Sistema = 3,
}

export interface RespuestaCopilotoDto {
  conversacionId: string;
  tipo: TipoRespuestaCopiloto;
  contenido: string;
  datosEstructurados: unknown | null;
  accionSugerida: AccionSugeridaDto | null;
  tokensUsados: number;
  tituloConversacion: string | null;
}

export interface AccionSugeridaDto {
  label: string;
  ruta: string;
}

export interface ConversacionCopilotoDto {
  id: string;
  titulo: string;
  totalMensajes: number;
  ultimoMensaje: string | null;
  fechaCreacion: string;
}

export interface MensajeCopilotoDto {
  id: string;
  rol: RolMensajeCopiloto;
  contenido: string;
  metadata: string | null;
  fechaCreacion: string;
}

export interface UsoDiarioCopilotoDto {
  tokensConsumidosHoy: number;
  limiteDiario: number;
  porcentajeUso: number;
}

export interface EnviarMensajeRequest {
  conversacionId?: string;
  mensaje: string;
}
