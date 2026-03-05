/**
 * Tipos para autenticacion B2C del portal de alquiler.
 * Alineados con AuthClienteController del backend.
 */

// POST /api/public/v1/alquiler/auth/registro-cliente
export interface RegistroClienteRequest {
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  tipoDocumento: number;
  numeroDocumento: string;
}

// POST /api/public/v1/alquiler/auth/login-cliente
export interface LoginClienteRequest {
  email: string;
}

// POST /api/public/v1/alquiler/auth/verificar-otp
export interface VerificarOtpClienteRequest {
  email: string;
  codigo: string;
}

// Respuesta de verificar-otp
export interface AuthClienteResultDto {
  token: string;
  clienteId: string;
  email: string;
  nombreCompleto: string;
  expiresAt: string;
}
