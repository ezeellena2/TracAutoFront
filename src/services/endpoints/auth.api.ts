/**
 * Servicio de endpoints de autenticación
 * Conecta con AuthController del backend
 */

import { apiClient } from '../http/apiClient';
import {
  RegistrarEmpresaRequest,
  RegistroEmpresaResponse,
  VerificarCuentaRequest,
  VerificacionCuentaResponse,
  ReenviarCodigoRequest,
  ReenviarCodigoResponse,
  LoginConGoogleRequest,
  GoogleAuthResponse,
  LoginResponse,
} from '@/shared/types/api';

const AUTH_BASE = 'auth';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export async function login(email: string, password: string, rememberMe: boolean = true): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(`${AUTH_BASE}/login`, {
    email,
    password,
    rememberMe,
  });

  return response.data;
}

export async function registrarEmpresa(data: RegistrarEmpresaRequest): Promise<RegistroEmpresaResponse> {
  const response = await apiClient.post<RegistroEmpresaResponse>(
    `${AUTH_BASE}/registrar-empresa`,
    data
  );
  return response.data;
}

export async function verificarCuenta(data: VerificarCuentaRequest): Promise<VerificacionCuentaResponse> {
  const response = await apiClient.post<VerificacionCuentaResponse>(
    `${AUTH_BASE}/verificar-cuenta`,
    data
  );
  return response.data;
}

export async function reenviarCodigo(data: ReenviarCodigoRequest): Promise<ReenviarCodigoResponse> {
  const response = await apiClient.post<ReenviarCodigoResponse>(
    `${AUTH_BASE}/reenviar-codigo`,
    data
  );
  return response.data;
}

export async function loginConGoogle(data: LoginConGoogleRequest): Promise<GoogleAuthResponse> {
  const response = await apiClient.post<GoogleAuthResponse>(
    `${AUTH_BASE}/google`,
    data
  );
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post(`${AUTH_BASE}/logout`);
}

export const authApi = {
  login,
  registrarEmpresa,
  verificarCuenta,
  reenviarCodigo,
  loginConGoogle,
  logout,
};
