/**
 * DTOs alineados con el backend TracAuto.Application
 */

import { z } from "zod";

// ==================== System DTOs ====================

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  cultureInfo: string;
}

// ==================== Auth DTOs ====================

/** Canal de envÃƒÂ­o para cÃƒÂ³digos de verificaciÃƒÂ³n */
export enum CanalEnvio {
  Email = 1,
  SMS = 2,
  Ambos = 3,
}

/** MÃƒÂ³dulos del sistema Ã¢â‚¬â€ valores alineados con backend ModuloSistema enum */
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

// --- Requests ---

// Schema reutilizable para validación fuerte de contraseñas
export const PasswordSchema = z.string()
  .min(8, "auth.errors.passwordMinLength")
  .regex(/[A-Z]/, "auth.errors.passwordUppercase")
  .regex(/[a-z]/, "auth.errors.passwordLowercase")
  .regex(/[0-9]/, "auth.errors.passwordNumber")
  .superRefine((val, ctx) => {
    // Si tiene menos de 14 caracteres, obligamos a un carácter especial para aumentar entropía
    // Si tiene 14 o más, asumimos que la longitud es suficiente seguridad
    if (val.length < 14 && !/[^a-zA-Z0-9]/.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "auth.errors.passwordSpecial",
      });
    }
  });

/** Tipo de cuenta/organización — alineado con backend TipoCuenta enum */
export enum TipoOrganizacion {
  FlotaPrivada = 1,
  Aseguradora = 2,
  TallerMecanico = 3,
  ConcesionarioAutos = 4,
  EmpresaRenting = 5,
}

export const RegistrarEmpresaRequestSchema = z.object({
  nombreEmpresa: z.string().min(2, "auth.errors.companyNameRequired"),
  razonSocial: z.string().optional(),
  cuit: z
    .string()
    .min(11, "auth.errors.cuitLength")
    .max(11, "auth.errors.cuitLength"),
  tipoOrganizacion: z.nativeEnum(TipoOrganizacion).optional(),
  email: z.string().email("auth.errors.invalidEmail"),
  password: PasswordSchema,
  nombreCompleto: z.string().min(2, "auth.errors.fullNameRequired"),
  telefono: z
    .string()
    .regex(/^[\d\+\-\s\(\)]+$/, "auth.errors.invalidPhone")
    .max(20, "auth.errors.phoneMaxLength"),
  googleToken: z.string().optional(),
  aceptaTerminosYCondiciones: z.literal(true, {
    errorMap: () => ({ message: "auth.errors.termsRequired" }),
  }),
});
export const RegistrarEmpresaFormSchema = RegistrarEmpresaRequestSchema;

export type RegistrarEmpresaRequest = z.infer<
  typeof RegistrarEmpresaRequestSchema
>;

export const VerificarCuentaRequestSchema = z.object({
  usuarioId: z.string().uuid(),
  codigoEmail: z
    .string()
    .length(6, "auth.errors.codeFormat")
    .optional(),
  codigoTelefono: z
    .string()
    .length(6, "auth.errors.codeFormat")
    .optional(),
});
export type VerificarCuentaRequest = z.infer<
  typeof VerificarCuentaRequestSchema
>;

export const ReenviarCodigoRequestSchema = z.object({
  email: z.string().email("auth.errors.invalidEmail"),
  canal: z.nativeEnum(CanalEnvio),
});
export type ReenviarCodigoRequest = z.infer<typeof ReenviarCodigoRequestSchema>;

export const LoginConGoogleRequestSchema = z.object({
  idToken: z.string().min(100, "auth.errors.googleTokenInvalid"),
});
export type LoginConGoogleRequest = z.infer<typeof LoginConGoogleRequestSchema>;

export const SolicitarResetPasswordRequestSchema = z.object({
  email: z.string().email("auth.errors.invalidEmail"),
});
export type SolicitarResetPasswordRequest = z.infer<
  typeof SolicitarResetPasswordRequestSchema
>;

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email("auth.errors.invalidEmail"),
  token: z.string().min(1, "Obrigatório"),
  nuevaPassword: PasswordSchema,
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

// --- Responses ---

export interface RegistroEmpresaResponse {
  organizacionId: string;
  usuarioId: string;
  mensaje: string;
  requiereVerificacionTelefono: boolean;
  emailVerificado: boolean;
}

export interface AuthSessionSnapshotDto {
  usuarioId: string;
  organizacionId: string;
  nombreUsuario: string;
  email: string;
  nombreOrganizacion: string;
  rol: string;
  tipoOrganizacion?: number;
  theme?: OrganizacionThemeDto | null;
  modulosActivos?: number[];
}

export interface LoginResponse extends AuthSessionSnapshotDto {
  token: string;
}

export interface RefreshTokenResponse extends AuthSessionSnapshotDto {
  accessToken: string;
  expiresAt: string;
}

export interface VerificacionCuentaResponse extends AuthSessionSnapshotDto {
  token: string;
  mensaje: string;
  emailVerificado?: boolean;
  telefonoVerificado?: boolean;
}

export interface ReenviarCodigoResponse {
  usuarioId: string;
  organizacionId: string;
  nombreOrganizacion: string;
  mensaje: string;
  enviadoPorEmail: boolean;
  enviadoPorSms: boolean;
}

export interface GoogleAuthResponse {
  token: string | null;
  usuarioId: string | null;
  organizacionId: string | null;
  email: string;
  nombre: string;
  nombreUsuario?: string | null;
  rol?: string | null;
  requiereRegistro: boolean;
  fotoUrl: string | null;
  nombreOrganizacion: string | null;
  theme: OrganizacionThemeDto | null;
  modulosActivos?: number[];
}
// ==================== Organizaciones DTOs ====================

/**
 * DTO de theme/branding de organizaciÃƒÂ³n.
 * Alineado con el backend: todos los campos son opcionales para overrides parciales.
 */
export interface OrganizacionThemeDto {
  // Branding
  logoUrl?: string | null;
  faviconUrl?: string | null;

  // Colores principales
  primary?: string | null;
  primaryDark?: string | null;
  secondary?: string | null;

  // Fondos y superficies
  background?: string | null;
  surface?: string | null;

  // Texto
  text?: string | null;
  textMuted?: string | null;

  // UI
  border?: string | null;
  success?: string | null;
  warning?: string | null;
  error?: string | null;

  // Roles (solo bg/text en backend)
  roleAdminBg?: string | null;
  roleAdminText?: string | null;
  roleOperadorBg?: string | null;
  roleOperadorText?: string | null;
  roleAnalistaBg?: string | null;
  roleAnalistaText?: string | null;
}

export interface OrganizacionRelacionDto {

  id: string;
  solicitanteOrganizacionId: string;
  solicitanteOrganizacionNombre: string;
  destinoOrganizacionId: string;
  destinoOrganizacionNombre: string;
  tipoRelacion?: string | null;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPorUsuarioId?: string | null;
  modificadoPorUsuarioId?: string | null;
  estado: string;
  estadoId: number;
  esSolicitante: boolean;
}

export enum TipoRecurso {
  Vehiculo = 1,
  Conductor = 2,
  DispositivoTraccar = 3,
}

export interface ResourceExclusionDto {
  id: string;
  organizacionRelacionId: string;
  fromOrganizacionId: string;
  toOrganizacionId: string;
  resourceType: TipoRecurso;
  resourceId: string;
  resourceName?: string; // Nombre del recurso para mostrar en UI
  activo: boolean;
  motivo?: string | null;
  fechaCreacion: string;
}

export interface AddResourceExclusionsCommand {
  resourceType: TipoRecurso;
  resourceIds: string[];
  motivo?: string | null;
}

export interface RemoveResourceExclusionsCommand {
  resourceType: TipoRecurso;
  resourceIds: string[];
}

// ==================== Solicitudes Vinculacion DTOs ====================

export enum EstadoSolicitudVinculacion {
  Pendiente = 1,
  Aceptada = 2,
  Rechazada = 3,
  Cancelada = 4,
  Finalizada = 5
}

export interface SolicitudVinculacionDto {
  id: string; // RelacionId
  organizacionSolicitanteId: string;
  organizacionSolicitanteNombre: string;
  organizacionDestinoId: string;
  organizacionDestinoNombre: string;
  estado: EstadoSolicitudVinculacion;
  fechaSolicitud: string;
  fechaRespuesta?: string | null;
  mensaje?: string | null;
}

export interface SolicitarVinculacionRequest {
  organizacionDestinoId: string;
  recursosACompartir?: TipoRecurso[] | null;
}

export interface ResponderSolicitudVinculacionRequest {
  relacionId: string;
  aceptar: boolean;
  recursosACompartir?: TipoRecurso[] | null;
}

export interface OrganizacionDto {
  id: string;
  nombre: string;
  razonSocial: string | null;
  cuit: string | null;
  activa: boolean;
  fechaCreacion: string;
  /**
   * Override parcial del tema base (opcional)
   * Solo se especifican los valores que la organizaciÃƒÂ³n quiere personalizar
   * Si no estÃƒÂ¡ presente, se usa el tema base segÃƒÂºn dark/light mode
   */
  theme?: OrganizacionThemeDto | null;
  /** MÃƒÂ³dulos activos de la organizaciÃƒÂ³n (valores de ModuloSistema) */
  modulosActivos?: number[];
}

export interface ListaPaginada<T> {
  items: T[];
  paginaActual: number;
  tamanoPagina: number;
  totalPaginas: number;
  totalRegistros: number;
  /** P1.1 FIX: EstadÃƒÂ­sticas opcionales calculadas en backend */
  estadisticas?: Record<string, number>;
}

export interface PaginacionParams {
  numeroPagina?: number;
  tamanoPagina?: number;
  ordenarPor?: string;
  descendente?: boolean;
}

// ==================== Solicitudes de Cambio ====================

export enum EstadoSolicitudCambio {
  Draft = 0,
  NeedsInfo = 1,
  Ready = 2,
  Submitted = 3,
  Exported = 4,
  Failed = 5,
}

export interface MensajeChatDto {
  id: string;
  rol: 'user' | 'assistant';
  contenido: string;
  readyForJira: boolean;
  fechaCreacion: string;
}

export interface SolicitudCambioDto {
  id: string;
  route?: string | null;
  crKey?: string | null;
  label?: string | null;
  estado: EstadoSolicitudCambio;
  jiraIssueKey?: string | null;
  jiraIssueUrl?: string | null;
  readyForJira: boolean;
  /** JSON de la especificaciÃƒÂ³n (vista previa del ticket) */
  specJson?: string | null;
  mensajes: MensajeChatDto[];
  fechaCreacion: string;
}

export interface CrearSolicitudRequest {
  route?: string | null;
  crKey?: string | null;
  label?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  elementTag?: string | null;
  pageTitle?: string | null;
  mensajeInicial?: string | null;
}

export interface AgregarMensajeRequest {
  contenido: string;
  imagenBase64?: string | null;
}

// ==================== Error Response ====================

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  // Campos adicionales de TracAuto para flujos de verificación/auth
  emailVerificado?: boolean;
  telefonoVerificado?: boolean;
  usuarioId?: string;
  traceId?: string;
  timestamp?: string;
  /** Retry-after in seconds (rate limiting) */
  retryAfter?: number;
  /** FluentValidation / field-level errors */
  errors?: Record<string, string[]>;
  extensions?: Record<string, unknown>;
  [key: string]: unknown;
}

// ==================== Usuarios de OrganizaciÃƒÂ³n DTOs ====================

export interface UsuarioOrganizacionDto {
  usuarioId: string;
  email: string;
  nombreCompleto: string;
  rol: 'Admin' | 'Operador' | 'Analista';
  esDuenio: boolean;
  activo: boolean;
  fechaAsignacion: string;
}

// ==================== Invitaciones DTOs ====================

export type EstadoInvitacion = 'Pendiente' | 'Aceptada' | 'Expirada' | 'Cancelada';

export interface InvitacionDto {
  id: string;
  email: string;
  organizacionId: string;
  nombreOrganizacion: string;
  rolAsignado: 'Admin' | 'Operador' | 'Analista';
  estado: EstadoInvitacion;
  fechaExpiracion: string;
  fechaCreacion: string;
  fechaAceptacion: string | null;
}

// --- Invitaciones Requests ---

export interface CreateInvitacionRequest {
  email: string;
  rolAsignado: 'Admin' | 'Operador' | 'Analista';
}

export interface AceptarInvitacionRequest {
  nombreCompleto: string;
  password: string;
  telefono?: string;
}

// --- Invitaciones Responses ---

export interface AceptarInvitacionResponse {
  usuarioId: string;
  organizacionId: string;
  nombreOrganizacion: string;
  rol: string;
  mensaje: string;
}

// --- Cambiar Rol Request ---

export interface CambiarRolRequest {
  nuevoRol: 'Admin' | 'Operador' | 'Analista';
}

// ==================== Vehiculos DTOs ====================

export enum TipoVehiculo {
  Auto = 1,
}

/**
 * Resumen minimo de una organizacion para mostrar en UI
 */
export interface OrganizacionResumenDto {
  id: string;
  nombre: string;
}

/**
 * Informacion resumida de comparticion de un recurso.
 * Indica con cuantas organizaciones esta compartido y cuales son.
 */
export interface RecursoSharingInfoDto {
  /** Indica si el recurso esta compartido con al menos una organizacion */
  estaCompartido: boolean;
  /** Cantidad de organizaciones con las que esta compartido */
  cantidadOrganizaciones: number;
  /** Lista de organizaciones con las que esta compartido (limitada a las primeras 3) */
  organizaciones: OrganizacionResumenDto[];
}

export interface VehiculoDto {
  id: string;
  tipo: TipoVehiculo;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  dispositivoActivoId: string | null;
  dispositivoActivoNombre?: string | null;
  esRecursoAsociado: boolean;
  /**
   * Informacion de comparticion del recurso.
   * Solo se incluye para recursos propios (esRecursoAsociado = false).
   * Indica con cuantas y cuales organizaciones esta compartido este vehiculo.
   */
  compartidoCon?: RecursoSharingInfoDto | null;
  permisoAcceso?: NivelPermisoCompartido;
}

// ==================== Dispositivos DTOs ====================

/**
 * Estados de stock de un dispositivo GPS
 */
export enum EstadoStockDispositivo {
  EnStock = 0,
  Instalado = 1,
  EnReparacion = 2,
  DadoDeBaja = 3,
}

/**
 * DTO de dispositivo para listado (GET /api/v1/dispositivos)
 * El backend ya aplica:
 * - Autenticación
 * - Tenancy (organización desde el token)
 * - Ownership (allow-list por organización)
 *
 * IMPORTANTE:
 * - El frontend NO envía organizationId ni filtra por organización.
 * - No se expone TraccarDeviceId.
 */
export interface DispositivoDto {
  id: string;
  nombre: string;
  activo: boolean;
  estadoConexion: string | null;
  uniqueId: string | null; // IMEI / Traccar UniqueId
  ultimaActualizacionUtc: string | null; // ISO 8601 UTC
  /** Número de teléfono en formato E.164 (ej. +5491112345678). */
  numeroTelefono?: string | null;

  // Stock / QR fields
  estadoStock: EstadoStockDispositivo;
  codigoQr: string;
  ubicacionFisica?: string | null;
  notasInternas?: string | null;
  modeloDispositivo?: string | null;
  proveedor?: string | null;
  fechaCompra?: string | null;
  garantiaHasta?: string | null;

  esRecursoAsociado: boolean;
  /**
   * Informacion de comparticion del recurso.
   * Solo se incluye para recursos propios (esRecursoAsociado = false).
   * Indica con cuantas y cuales organizaciones esta compartido este dispositivo.
   */
  compartidoCon?: RecursoSharingInfoDto | null;
  permisoAcceso?: NivelPermisoCompartido;
}

/**
 * DTO público de un dispositivo (accesible sin autenticación a través de QR)
 */
export interface DispositivoQrPublicoDto {
  codigoQr: string;
  imei: string;
  alias?: string | null;
  numeroTelefono?: string | null;
  modeloDispositivo?: string | null;
  proveedor?: string | null;
  estadoStock: EstadoStockDispositivo;
  vehiculoAsignado?: string | null;
  vehiculoPatente?: string | null;
  organizacionNombre?: string | null;
  urlMapa?: string | null;
  urlHistorial?: string | null;
}

/**
 * DTO de un registro del historial de stock
 */
export interface HistorialStockDispositivoDto {
  id: string;
  estadoAnterior: EstadoStockDispositivo;
  estadoNuevo: EstadoStockDispositivo;
  nota?: string | null;
  fechaMovimiento: string;
  usuarioId: string;
  usuarioNombre?: string | null;
}

/**
 * Request body para cambiar el estado de stock
 */
export interface CambiarEstadoStockRequest {
  nuevoEstado: EstadoStockDispositivo;
  nota?: string | null;
}

// ==================== Marketplace DTOs ====================

/**
 * Estados posibles de una publicaciÃƒÂ³n en el marketplace
 */
export enum EstadoPublicacion {
  Borrador = 1,
  Publicado = 2,
  Pausado = 3,
  Vendido = 4,
}

/**
 * DTO de vehÃƒÂ­culo con informaciÃƒÂ³n de marketplace
 */
export interface VehiculoMarketplaceDto {
  // Datos del vehÃƒÂ­culo
  vehiculoId: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  activo: boolean;

  // Datos de la publicaciÃƒÂ³n (null si no publicado)
  publicacionId: string | null;
  estadoPublicacion: EstadoPublicacion | null;
  precio: number | null;
  moneda: string | null;
  kilometraje: number;
  descripcion: string | null;
  destacado: boolean;
  fechaPublicacion: string | null; // ISO 8601

  /**
   * Indica si la publicaciÃƒÂ³n tiene un vehÃƒÂ­culo operativo asociado.
   * Si es false, es una publicaciÃƒÂ³n independiente (solo para venta).
   */
  tieneVehiculoAsociado: boolean;
}

/**
 * Request para publicar un vehÃƒÂ­culo en el marketplace
 */
export interface PublicarVehiculoRequest {
  precio: number | null;
  moneda: string;
  kilometraje: number;
  descripcion: string | null;
}

/**
 * Request para editar una publicaciÃƒÂ³n existente
 */
export interface EditarPublicacionRequest {
  precio: number | null;
  moneda: string | null;
  kilometraje: number;
  descripcion: string | null;
  estado: EstadoPublicacion;
}

/**
 * Request para crear un vehÃƒÂ­culo directamente en el marketplace
 */
export interface CreateVehiculoMarketplaceRequest {
  patente: string;
  marca?: string | null;
  modelo?: string | null;
  anio?: number | null;
  precio?: number | null;
  moneda?: string;
  kilometraje?: number;
  descripcion?: string | null;
  estado?: EstadoPublicacion;
  vehiculoId?: string | null;
}

/**
 * Request para vincular un vehÃƒÂ­culo del marketplace a un vehÃƒÂ­culo/dispositivo/conductor
 */
export interface VincularVehiculoMarketplaceRequest {
  vehiculoId?: string | null;
  dispositivoId?: string | null;
  conductorId?: string | null;
  motivoCambio?: string | null;
}

// ==================== Recursos Compartibles DTOs ====================

/**
 * Estado de comparticion de un recurso para una relacion especifica
 */
export enum EstadoComparticion {
  /** Recurso disponible para compartir (no tiene asignacion ni exclusion activa) */
  Disponible = 0,
  /** Recurso ya compartido (tiene asignacion activa en esta relacion) */
  YaCompartido = 1,
  /** Recurso excluido (tiene exclusion activa en esta relacion) */
  Excluido = 2,
}

/**
 * DTO para representar un recurso con su estado de comparticion para una relacion especifica
 */
export interface RecursoCompartibleDto {
  /** ID del recurso (vehiculo, conductor o dispositivo) */
  id: string;
  /** Nombre principal del recurso (Patente, NombreCompleto, Alias) */
  nombre: string;
  /** Descripcion secundaria (Marca+Modelo, DNI, TraccarDeviceId) */
  descripcion: string | null;
  /** Estado de comparticion para esta relacion */
  estado: EstadoComparticion;
  /** ID de la asignacion (solo si estado == YaCompartido) */
  asignacionId: string | null;
  /** Fecha en que se compartio (solo si estado == YaCompartido) */
  fechaCompartido: string | null;
  /** ID de la exclusion (solo si estado == Excluido) */
  exclusionId: string | null;
  /** Motivo de la exclusion (solo si estado == Excluido) */
  motivoExclusion: string | null;
}

/**
 * Respuesta paginada de recursos compartibles con contadores por estado
 */
export interface RecursosCompartiblesResponse {
  items: RecursoCompartibleDto[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
  tamanoPagina: number;
  /** Total de recursos disponibles para compartir */
  totalDisponibles: number;
  /** Total de recursos ya compartidos */
  totalYaCompartidos: number;
  /** Total de recursos excluidos */
  totalExcluidos: number;
  tipoRecurso: TipoRecurso;
  relacionId: string;
}

/**
 * Parametros para obtener recursos compartibles
 */
export interface GetRecursosCompartiblesParams {
  resourceType: TipoRecurso;
  numeroPagina?: number;
  tamanoPagina?: number;
  buscar?: string;
  estado?: EstadoComparticion;
}

// ==================== Sharing Status DTOs (Individual Resource) ====================

/**
 * Estado de comparticiÃƒÂ³n de un recurso con todas las relaciones disponibles.
 * Muestra quÃƒÂ© relaciones tienen este recurso compartido, excluido o disponible.
 */
export interface RecursoSharingStatusDto {
  /** ID del recurso consultado */
  resourceId: string;
  /** Tipo de recurso (Vehiculo, Conductor, DispositivoTraccar) */
  resourceType: TipoRecurso;
  /** Nombre del recurso para mostrar en UI */
  resourceName: string;
  /** Lista de relaciones con su estado de comparticiÃƒÂ³n para este recurso */
  relaciones: RelacionSharingItemDto[];
}

/**
 * Estado de comparticiÃƒÂ³n de un recurso para una relaciÃƒÂ³n especÃƒÂ­fica.
 */
export interface RelacionSharingItemDto {
  /** ID de la relaciÃƒÂ³n entre organizaciones */
  relacionId: string;
  /** ID de la organizaciÃƒÂ³n destino (con la que se comparte) */
  organizacionDestinoId: string;
  /** Nombre de la organizaciÃƒÂ³n destino */
  organizacionDestinoNombre: string;
  /** Indica si el recurso estÃƒÂ¡ compartido con esta relaciÃƒÂ³n */
  estaCompartido: boolean;
  /** Indica si el recurso estÃƒÂ¡ excluido en esta relaciÃƒÂ³n */
  estaExcluido: boolean;
  /** Fecha en que se compartiÃƒÂ³ el recurso (si estÃƒÂ¡ compartido) */
  fechaCompartido?: string | null;
  /** Fecha en que se excluyÃƒÂ³ el recurso (si estÃƒÂ¡ excluido) */
  fechaExcluido?: string | null;
  /** Motivo de la exclusiÃƒÂ³n (si estÃƒÂ¡ excluido) */
  motivoExclusion?: string | null;
  /** ID de la asignaciÃƒÂ³n activa (si estÃƒÂ¡ compartido) */
  asignacionId?: string | null;
  /** ID de la exclusiÃƒÂ³n activa (si estÃƒÂ¡ excluido) */
  exclusionId?: string | null;
  /** Nivel de permiso de la asignaciÃƒÂ³n (si estÃƒÂ¡ compartido) */
  permiso?: NivelPermisoCompartido | null;
}

/**
 * Estado deseado para un recurso en una relaciÃƒÂ³n.
 */
export enum EstadoComparticionDeseado {
  /** El recurso no estÃƒÂ¡ ni compartido ni excluido (disponible) */
  Disponible = 0,
  /** El recurso estÃƒÂ¡ compartido (visible para la otra organizaciÃƒÂ³n) */
  Compartido = 1,
  /** El recurso estÃƒÂ¡ excluido (no visible, deny) */
  Excluido = 2,
}

/**
 * Nivel de permiso para recursos compartidos.
 */
export enum NivelPermisoCompartido {
  /** Solo puede ver el recurso (lectura) */
  SoloLectura = 0,
  /** Puede ver y gestionar operativamente el recurso (asignar/desasignar) */
  GestionOperativa = 1,
}

/**
 * Cambio de estado de comparticiÃƒÂ³n para una relaciÃƒÂ³n especÃƒÂ­fica.
 */
export interface CambioComparticionRelacion {
  /** ID de la relaciÃƒÂ³n */
  relacionId: string;
  /** Nuevo estado deseado para el recurso en esta relaciÃƒÂ³n */
  nuevoEstado: EstadoComparticionDeseado;
  /** Motivo de la exclusiÃƒÂ³n (solo aplica si nuevoEstado == Excluido) */
  motivoExclusion?: string | null;
  /** Nivel de permiso (solo aplica si nuevoEstado == Compartido) */
  permiso?: NivelPermisoCompartido | null;
}

/**
 * Request para actualizar el estado de comparticiÃƒÂ³n de un recurso.
 */
export interface ActualizarComparticionRequest {
  cambios: CambioComparticionRelacion[];
}



