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
  Aseguradora = 1,
  BrokerSeguros = 2,
  FlotaPrivada = 3,
  RentACar = 4,
  Otro = 99,
}

// --- Requests ---

export const RegistrarEmpresaRequestSchema = z.object({
  nombreEmpresa: z.string().min(2, "Nombre de empresa requerido"),
  razonSocial: z.string().optional(),
  cuit: z.string().optional(),
  tipoOrganizacion: z.nativeEnum(TipoOrganizacion),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  nombreCompleto: z.string().min(2, "Nombre completo requerido"),
  telefono: z.string().optional(),
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

export interface OrganizacionDto {
  id: string;
  nombre: string;
  razonSocial: string | null;
  cuit: string | null;
  tipo: TipoOrganizacion;
  activa: boolean;
  fechaCreacion: string;
  logoUrl: string | null;
}

export interface ListaPaginada<T> {
  items: T[];
  numeroPagina: number;
  tamanoPagina: number;
  totalPaginas: number;
  totalItems: number;
  tienePaginaAnterior: boolean;
  tienePaginaSiguiente: boolean;
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
