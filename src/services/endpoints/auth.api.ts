/**
 * Servicio de endpoints de autenticación
 * Conecta con AuthController del backend
 */

import { apiClient } from '../http/apiClient';
import { mockHandlers, shouldUseMocks } from '../mock';
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
} from '@/shared/types/api';

const AUTH_BASE = 'auth';

// DTO para login request
export interface LoginRequest {
  email: string;
  password: string;
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
}

/**
 * Login con email y contraseña
 * Nuevo endpoint POST /api/v1/auth/login
 */
export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  if (shouldUseMocks()) {
    // Fallback a mock si VITE_USE_MOCKS=true
    const response = await mockHandlers.login(email, password, 'org-segurostech');
    
    if (!response.ok) {
      throw new Error((response.data as { message: string }).message);
    }
    
    return response.data as { token: string; user: AuthUser };
  }

  // Llamada real al backend
  const response = await apiClient.post<LoginResponse>(`${AUTH_BASE}/login`, {
    email,
    password,
  });

  // Mapear respuesta del backend a AuthUser
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
  if (shouldUseMocks()) {
    return {
      organizacionId: crypto.randomUUID(),
      usuarioId: crypto.randomUUID(),
      mensaje: 'Empresa registrada. Verifique su email.',
      requiereVerificacionTelefono: !!data.telefono,
      emailVerificado: !!data.googleToken,
    };
  }

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
  if (shouldUseMocks()) {
    return {
      token: `mock-jwt-${Date.now()}`,
      organizacionId: crypto.randomUUID(),
      mensaje: 'Cuenta verificada exitosamente',
    };
  }

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
  if (shouldUseMocks()) {
    return {
      mensaje: 'Códigos reenviados',
      enviadoPorEmail: data.canal === 1 || data.canal === 3,
      enviadoPorSms: data.canal === 2 || data.canal === 3,
    };
  }

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
  if (shouldUseMocks()) {
    return {
      token: `mock-jwt-google-${Date.now()}`,
      organizacionId: crypto.randomUUID(),
      email: 'user@gmail.com',
      nombre: 'Usuario Demo',
      requiereRegistro: false,
      fotoUrl: null,
    };
  }

  const response = await apiClient.post<GoogleAuthResponse>(
    `${AUTH_BASE}/google`,
    data
  );
  return response.data;
}

export const authApi = {
  login,
  loginTradicional,
  registrarEmpresa,
  verificarCuenta,
  reenviarCodigo,
  loginConGoogle,
};
