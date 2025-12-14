/**
 * Tipos base para autenticación
 */

export type UserRole = 'Admin' | 'Operador' | 'Analista';

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  organizationId: string;
  organizationName: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
  expiresAt: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface RegistrarEmpresaRequest {
  nombreEmpresa: string;
  email: string;
  nombreContacto: string;
  password: string;
}

export interface VerificarCuentaRequest {
  email: string;
  codigo: string;
}

export interface ReenviarCodigoRequest {
  email: string;
}
