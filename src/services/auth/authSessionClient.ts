import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ActivarCuentaRequest,
  ActivarCuentaResponse,
  AppleAuthResponse,
  AuthClientPlatform,
  CambiarContextoResponse,
  ContextoDisponibleDto,
  GoogleAuthResponse,
  LoginConAppleRequest,
  LoginConGoogleRequest,
  LoginResponse,
  ReenviarCodigoRequest,
  ReenviarCodigoResponse,
  RefreshSessionRequest,
  RefreshTokenResponse,
  RegistrarEmpresaRequest,
  RegistroEmpresaResponse,
  ResetPasswordRequest,
  SolicitarResetPasswordRequest,
  ValidarActivacionCuentaResponse,
  VerificacionCuentaResponse,
  VerificarCuentaRequest,
} from '@/shared/types/api';

const AUTH_BASE = 'auth';

export interface CambiarContextoRequest {
  tipoContexto: 'Personal' | 'Organizacion';
  contextoId?: string | null;
}

type BasicHttpClient = Pick<AxiosInstance, 'get' | 'post'>;

export interface AuthSessionTransport {
  authenticatedClient: BasicHttpClient;
  anonymousClient: BasicHttpClient;
}

export interface AuthSessionClientOptions {
  clientPlatform?: AuthClientPlatform;
  requestConfig?: AxiosRequestConfig;
}

export interface RefreshSessionOptions extends AuthSessionClientOptions, RefreshSessionRequest {}

export interface LogoutSessionOptions extends AuthSessionClientOptions {
  refreshToken?: string | null;
}

function withPlatformHeaders(options?: AuthSessionClientOptions): AxiosRequestConfig | undefined {
  if (!options?.clientPlatform || options.clientPlatform === 'web') {
    return options?.requestConfig;
  }

  return {
    ...options.requestConfig,
    headers: {
      ...(options.requestConfig?.headers ?? {}),
      'X-Client-Type': 'mobile',
    },
  };
}

function buildRefreshBody(options?: RefreshSessionOptions): RefreshSessionRequest | null {
  if (!options) {
    return null;
  }

  const hasContext =
    options.tipoContextoActivo !== undefined || options.contextoActivoId !== undefined;

  if (options.clientPlatform === 'mobile') {
    return {
      refreshToken: options.refreshToken ?? null,
      tipoContextoActivo: options.tipoContextoActivo ?? null,
      contextoActivoId: options.contextoActivoId ?? null,
    };
  }

  if (!hasContext) {
    return null;
  }

  return {
    tipoContextoActivo: options.tipoContextoActivo ?? null,
    contextoActivoId: options.contextoActivoId ?? null,
  };
}

export function createAuthSessionClient(transport: AuthSessionTransport) {
  const { anonymousClient, authenticatedClient } = transport;

  return {
    async login(
      email: string,
      password: string,
      rememberMe: boolean = true,
      options?: AuthSessionClientOptions
    ): Promise<LoginResponse> {
      const response = await anonymousClient.post<LoginResponse>(
        `${AUTH_BASE}/login`,
        { email, password, rememberMe },
        withPlatformHeaders(options)
      );
      return response.data;
    },

    async registrarEmpresa(
      data: RegistrarEmpresaRequest,
      options?: AuthSessionClientOptions
    ): Promise<RegistroEmpresaResponse> {
      const response = await anonymousClient.post<RegistroEmpresaResponse>(
        `${AUTH_BASE}/registrar-empresa`,
        data,
        withPlatformHeaders(options)
      );
      return response.data;
    },

    async verificarCuenta(
      data: VerificarCuentaRequest,
      options?: AuthSessionClientOptions
    ): Promise<VerificacionCuentaResponse> {
      const response = await anonymousClient.post<VerificacionCuentaResponse>(
        `${AUTH_BASE}/verificar-cuenta`,
        data,
        withPlatformHeaders(options)
      );
      return response.data;
    },

    async validarActivacionCuenta(
      token: string,
      options?: AuthSessionClientOptions
    ): Promise<ValidarActivacionCuentaResponse> {
      const response = await anonymousClient.get<ValidarActivacionCuentaResponse>(
        `${AUTH_BASE}/activar-cuenta/${token}`,
        withPlatformHeaders(options)
      );
      return response.data;
    },

    async activarCuenta(
      data: ActivarCuentaRequest,
      options?: AuthSessionClientOptions
    ): Promise<ActivarCuentaResponse> {
      const response = await anonymousClient.post<ActivarCuentaResponse>(
        `${AUTH_BASE}/activar-cuenta`,
        data,
        withPlatformHeaders(options)
      );
      return response.data;
    },

    async reenviarCodigo(
      data: ReenviarCodigoRequest,
      options?: AuthSessionClientOptions
    ): Promise<ReenviarCodigoResponse> {
      const response = await anonymousClient.post<ReenviarCodigoResponse>(
        `${AUTH_BASE}/reenviar-codigo`,
        data,
        withPlatformHeaders(options)
      );
      return response.data;
    },

    async loginConGoogle(
      data: LoginConGoogleRequest,
      options?: AuthSessionClientOptions
    ): Promise<GoogleAuthResponse> {
      const response = await anonymousClient.post<GoogleAuthResponse>(
        `${AUTH_BASE}/google`,
        data,
        withPlatformHeaders(options)
      );
      return response.data;
    },

    async loginConApple(
      data: LoginConAppleRequest,
      options?: AuthSessionClientOptions
    ): Promise<AppleAuthResponse> {
      const response = await anonymousClient.post<AppleAuthResponse>(
        `${AUTH_BASE}/apple`,
        data,
        withPlatformHeaders(options)
      );
      return response.data;
    },

    async refreshSession(options?: RefreshSessionOptions): Promise<RefreshTokenResponse> {
      const response = await anonymousClient.post<RefreshTokenResponse>(
        `${AUTH_BASE}/refresh`,
        buildRefreshBody(options),
        withPlatformHeaders(options)
      );
      return response.data;
    },

    async getContextosDisponibles(options?: AuthSessionClientOptions): Promise<ContextoDisponibleDto[]> {
      const response = await authenticatedClient.get<ContextoDisponibleDto[]>(
        `${AUTH_BASE}/contextos`,
        withPlatformHeaders(options)
      );
      return response.data;
    },

    async cambiarContexto(
      data: CambiarContextoRequest,
      options?: AuthSessionClientOptions
    ): Promise<CambiarContextoResponse> {
      const response = await authenticatedClient.post<CambiarContextoResponse>(
        `${AUTH_BASE}/cambiar-contexto`,
        data,
        withPlatformHeaders(options)
      );
      return response.data;
    },

    async solicitarResetPassword(
      data: SolicitarResetPasswordRequest,
      options?: AuthSessionClientOptions
    ): Promise<void> {
      await anonymousClient.post(
        `${AUTH_BASE}/solicitar-reset-password`,
        data,
        withPlatformHeaders(options)
      );
    },

    async logout(options?: LogoutSessionOptions): Promise<void> {
      const body =
        options?.clientPlatform === 'mobile'
          ? { refreshToken: options.refreshToken ?? null }
          : null;

      await authenticatedClient.post(
        `${AUTH_BASE}/logout`,
        body,
        withPlatformHeaders(options)
      );
    },

    async resetPassword(
      data: ResetPasswordRequest,
      options?: AuthSessionClientOptions
    ): Promise<void> {
      await anonymousClient.post(
        `${AUTH_BASE}/reset-password`,
        data,
        withPlatformHeaders(options)
      );
    },

    async validarResetToken(
      token: string,
      options?: AuthSessionClientOptions
    ): Promise<{ email: string }> {
      const response = await anonymousClient.get<{ email: string }>(
        `${AUTH_BASE}/reset-password/${token}`,
        withPlatformHeaders(options)
      );
      return response.data;
    },
  };
}
