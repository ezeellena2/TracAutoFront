// Enums alineados con backend
export enum EstadoSuscripcion {
  Trial = 1,
  Activa = 2,
  PausadaPorFaltaDePago = 3,
  Cancelada = 4,
  Expirada = 5,
  PendienteVerificacionPago = 6,
}

export enum PeriodoFacturacion {
  Mensual = 1,
  Anual = 2,
}

export enum NivelPlan {
  Free = 0,
  Trial = 1,
  Basico = 2,
  Profesional = 3,
  Enterprise = 4,
}

export enum ModuloSistema {
  Flota = 1,
  Telematica = 2,
  Marketplace = 3,
  Alquiler = 4,
  AlquilerPublico = 5,
  Taller = 6,
  Seguros = 7,
  RideHailing = 8,
  Delivery = 9,
  FlotaLogistica = 10,
  Reportes = 11,
  Integraciones = 12,
  Scoring = 13,
}

export enum GatewayPago {
  Ninguno = 0,
  Stripe = 1,
  MercadoPago = 2,
  Transferencia = 3,
}

export enum TipoSuscripcion {
  Normal = 1,
  Demo = 2,
  Cortesia = 3,
  Internal = 4,
}

// DTOs de respuesta

export interface LimitePlanDto {
  claveRecurso: string;
  valorLimite: number;
  descripcion?: string;
}

export interface PlanModuloDto {
  id: string;
  moduloSistema: ModuloSistema;
  nivelPlan: NivelPlan;
  precioMensualArs: number;
  precioMensualUsd: number;
  precioAnualArs: number;
  precioAnualUsd: number;
  activo: boolean;
  orden: number;
  esDefault: boolean;
  limites: LimitePlanDto[];
}

export interface SuscripcionModuloDto {
  id: string;
  moduloSistema: ModuloSistema;
  nivelPlan: NivelPlan;
  precioMensual: number;
  activo: boolean;
}

export interface SuscripcionDto {
  id: string;
  estado: EstadoSuscripcion;
  tipoSuscripcion: TipoSuscripcion;
  gateway: GatewayPago;
  requierePago: boolean;
  periodoFacturacion: PeriodoFacturacion;
  moneda: string;
  montoTotalMensual: number;
  fechaInicio: string;
  fechaFin?: string;
  fechaFinTrial?: string;
  fechaCancelacion?: string;
  fechaFinExencion?: string;
  motivoExencion?: string;
  modulos: SuscripcionModuloDto[];
}

export interface ModuloActivoDto {
  codigo: ModuloSistema;
  nombre: string;
  icono?: string;
  fechaActivacion: string;
  activadoPorUsuarioId?: string;
  notas?: string;
}

export interface ModuloDisponibleDto {
  codigo: ModuloSistema;
  nombre: string;
  descripcion: string;
  icono?: string;
  orden: number;
  esBase: boolean;
  esGratis: boolean;
  estaActivo: boolean;
  fechaActivacion?: string;
  cumplePrerequisitos: boolean;
  prerequisitosFaltantes: string[];
}

export interface CheckoutSessionDto {
  sessionId: string;
  url: string;
}

export interface CrearSuscripcionRequest {
  modulos: CrearSuscripcionModuloItem[];
  periodoFacturacion: PeriodoFacturacion;
  moneda: string;
  gateway: GatewayPago;
}

export interface CrearSuscripcionModuloItem {
  moduloSistema: ModuloSistema;
  planModuloId: string;
}

// DTOs de uso vs límites (desde IUsoPlanService)

export interface UsoRecursoDto {
  recurso: string;
  limite: number;
  actual: number;
  porcentaje: number;
  excedido: boolean;
}

export interface LimitesModuloDto {
  moduloSistema: ModuloSistema;
  nivelPlan: NivelPlan;
  recursos: UsoRecursoDto[];
}
