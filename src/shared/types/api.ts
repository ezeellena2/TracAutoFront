/**
 * DTOs alineados con el backend TracAuto.Application
 */

import { z } from "zod";

// ==================== Auth DTOs ====================

/** Canal de envío para códigos de verificación */
export enum CanalEnvio {
  Email = 1,
  SMS = 2,
  Ambos = 3,
}

/** Tipo de organización */
export enum TipoOrganizacion {
  FlotaPrivada = 1,
  Aseguradora = 2,
  TallerMecanico = 3,
  ConcesionarioAutos = 4,
  EmpresaRenting = 5,
}

// --- Requests ---

export const RegistrarEmpresaRequestSchema = z.object({
  nombreEmpresa: z.string().min(2, "Nombre de empresa requerido"),
  razonSocial: z.string().optional(),
  cuit: z
    .string()
    .regex(/^[\d\-]+$/, "CUIT solo puede contener números y guiones")
    .max(20, "CUIT no puede exceder 20 caracteres")
    .optional(),
  tipoOrganizacion: z.nativeEnum(TipoOrganizacion),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número")
    .regex(/[^a-zA-Z0-9]/, "La contraseña debe contener al menos un carácter especial"),
  nombreCompleto: z.string().min(2, "Nombre completo requerido"),
  telefono: z
    .string()
    .regex(/^[\d\+\-\s\(\)]+$/, "Formato de teléfono inválido")
    .max(20, "Teléfono no puede exceder 20 caracteres")
    .optional(),
  googleToken: z.string().optional(),
});
export type RegistrarEmpresaRequest = z.infer<
  typeof RegistrarEmpresaRequestSchema
>;

export const VerificarCuentaRequestSchema = z.object({
  usuarioId: z.string().uuid(),
  codigoEmail: z.string().length(6, "Código de email debe tener 6 dígitos"),
  codigoTelefono: z
    .string()
    .length(6, "Código de teléfono debe tener 6 dígitos")
    .optional(),
});
export type VerificarCuentaRequest = z.infer<
  typeof VerificarCuentaRequestSchema
>;

export const ReenviarCodigoRequestSchema = z.object({
  email: z.string().email("Email inválido"),
  canal: z.nativeEnum(CanalEnvio),
});
export type ReenviarCodigoRequest = z.infer<typeof ReenviarCodigoRequestSchema>;

export const LoginConGoogleRequestSchema = z.object({
  idToken: z.string().min(100, "Token de Google inválido"),
});
export type LoginConGoogleRequest = z.infer<typeof LoginConGoogleRequestSchema>;

// --- Responses ---

export interface RegistroEmpresaResponse {
  organizacionId: string;
  usuarioId: string;
  mensaje: string;
  requiereVerificacionTelefono: boolean;
  emailVerificado: boolean;
}

export interface VerificacionCuentaResponse {
  token: string;
  organizacionId: string;
  mensaje: string;
}

export interface ReenviarCodigoResponse {
  mensaje: string;
  enviadoPorEmail: boolean;
  enviadoPorSms: boolean;
}

export interface GoogleAuthResponse {
  token: string | null;
  organizacionId: string | null;
  email: string;
  nombre: string;
  requiereRegistro: boolean;
  fotoUrl: string | null;
}

// ==================== Organizaciones DTOs ====================

/**
 * DTO de theme/branding de organización.
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
  organizacionAId: string;
  organizacionANombre: string;
  organizacionBId: string;
  organizacionBNombre: string;
  tipoRelacion?: string | null;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPorUsuarioId?: string | null;
  modificadoPorUsuarioId?: string | null;
}

export interface OrganizacionDto {
  id: string;
  nombre: string;
  razonSocial: string | null;
  cuit: string | null;
  tipoOrganizacion: TipoOrganizacion;
  activa: boolean;
  fechaCreacion: string;
  /**
   * Override parcial del tema base (opcional)
   * Solo se especifican los valores que la organización quiere personalizar
   * Si no está presente, se usa el tema base según dark/light mode
   */
  theme?: OrganizacionThemeDto | null;
}

export interface ListaPaginada<T> {
  items: T[];
  paginaActual: number;
  tamanoPagina: number;
  totalPaginas: number;
  totalRegistros: number;
}

export interface PaginacionParams {
  numeroPagina?: number;
  tamanoPagina?: number;
  ordenarPor?: string;
  descendente?: boolean;
}

// ==================== Error Response ====================

export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
  [key: string]: unknown;
}

// ==================== Usuarios de Organización DTOs ====================

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

// ==================== Dispositivos DTOs ====================

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
  estado: string | null;
  uniqueId: string | null; // IMEI / Traccar UniqueId
  ultimaActualizacionUtc: string | null; // ISO 8601 UTC
  organizacionAsociadaId?: string | null;
  organizacionAsociadaNombre?: string | null;
  esRecursoAsociado: boolean;
}
