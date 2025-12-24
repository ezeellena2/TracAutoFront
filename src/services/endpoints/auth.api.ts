/**
 * Servicio de endpoints de autenticación
 * Conecta con AuthController del backend
 */

import { apiClient } from '../http/apiClient';
import { AuthUser } from '@/shared/types';
import {
  RegistrarEmpresaRequest,
  RegistroEmpresaResponse,
  VerificarCuentaRequest,
  VerificacionCuentaResponse,
  ReenviarCodigoRequest,
  ReenviarCodigoResponse,
  LoginConGoogleRequest,
  GoogleAuthResponse,
  OrganizacionThemeDto,
} from '@/shared/types/api';

const AUTH_BASE = 'auth';

// DTO para login request
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// DTO para login response (alineado con backend)
export interface LoginResponse {
  token: string;
  usuarioId: string;
  organizacionId: string;
  nombreUsuario: string;
  email: string;
  nombreOrganizacion: string;
  rol: string;
  theme?: OrganizacionThemeDto | null;
}

/**
 * Login con email y contraseña
 * POST /api/v1/auth/login
 * @param rememberMe Si es true, sesión de 7 días. Si es false, sesión de 4 horas.
 */
export async function login(email: string, password: string, rememberMe: boolean = true): Promise<{
  token: string;
  user: AuthUser;
  theme?: OrganizacionThemeDto | null;
}> {
  const response = await apiClient.post<LoginResponse>(`${AUTH_BASE}/login`, {
    email,
    password,
    rememberMe,
  });

  const data = response.data;

  // Mapear rol del backend a UserRole del frontend
  const rolMap: Record<string, 'Admin' | 'Operador' | 'Analista'> = {
    'Admin': 'Admin',
    'Administrador': 'Admin',
    'Operador': 'Operador',
    'Analista': 'Analista',
  };

  return {
    token: data.token,
    user: {
      id: data.usuarioId,
      nombre: data.nombreUsuario,
      email: data.email,
      rol: rolMap[data.rol] || 'Operador',
      organizationId: data.organizacionId,
      organizationName: data.nombreOrganizacion,
    },
    theme: data.theme,
  };
}

/**
 * Login tradicional con email y password (legacy - redirige a login)
 */
export async function loginTradicional(
  email: string, 
  password: string, 
  _organizationId: string
): Promise<{ token: string; user: AuthUser }> {
  return login(email, password);
}

/**
 * Registra una nueva empresa y su usuario propietario
 */
export async function registrarEmpresa(data: RegistrarEmpresaRequest): Promise<RegistroEmpresaResponse> {
  const response = await apiClient.post<RegistroEmpresaResponse>(
    `${AUTH_BASE}/registrar-empresa`,
    data
  );
  return response.data;
}

/**
 * Verifica la cuenta con códigos de email y teléfono
 */
export async function verificarCuenta(data: VerificarCuentaRequest): Promise<VerificacionCuentaResponse> {
  const response = await apiClient.post<VerificacionCuentaResponse>(
    `${AUTH_BASE}/verificar-cuenta`,
    data
  );
  return response.data;
}

/**
 * Reenvía códigos de verificación
 */
export async function reenviarCodigo(data: ReenviarCodigoRequest): Promise<ReenviarCodigoResponse> {
  const response = await apiClient.post<ReenviarCodigoResponse>(
    `${AUTH_BASE}/reenviar-codigo`,
    data
  );
  return response.data;
}

/**
 * Login con Google (Token Exchange)
 */
export async function loginConGoogle(data: LoginConGoogleRequest): Promise<GoogleAuthResponse> {
  const response = await apiClient.post<GoogleAuthResponse>(
    `${AUTH_BASE}/google`,
    data
  );
  return response.data;
}

/**
 * Logout - revoca el refresh token en el backend
 * Best-effort: si falla, el frontend igual limpiará la sesión
 */
export async function logout(): Promise<void> {
  await apiClient.post(`${AUTH_BASE}/logout`);
}

export const authApi = {
  login,
  loginTradicional,
  registrarEmpresa,
  verificarCuenta,
  reenviarCodigo,
  loginConGoogle,
  logout,
};
