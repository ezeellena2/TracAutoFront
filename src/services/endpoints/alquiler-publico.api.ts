import { publicApiClient } from '../http/publicApiClient';
import type { BrandingPublicoDto } from '@/features/alquiler-publico/types/branding';
import type {
  SucursalPublicaDto,
  CategoriaPublicaDto,
  VehiculoDisponibleDto,
  BusquedaParams,
} from '@/features/alquiler-publico/types/busqueda';
import type {
  VehiculoAlquilerPublicoDto,
  CotizarPublicoRequest,
  ValidarPromocionPublicoRequest,
  OpcionesPublicasDto,
} from '@/features/alquiler-publico/types/detalle';
import type { CreateReservaPublicaRequest } from '@/features/alquiler-publico/types/reserva-publica';
import type {
  RegistroClienteRequest,
  LoginClienteRequest,
  VerificarOtpClienteRequest,
  AuthClienteResultDto,
} from '@/features/alquiler-publico/types/auth';
import type { ResultadoCotizacionDto } from '@/features/alquileres/types/cotizacion';
import type { ValidacionPromocionDto } from '@/features/alquileres/types/promocion';
import type { ReservaAlquilerResumenDto, ReservaAlquilerDetalleDto } from '@/features/alquileres/types/reserva';

const BASE = 'alquiler';

/**
 * API publica del portal de alquiler B2C (sin autenticacion).
 * Consume /api/public/v1/alquiler/*
 */
export const alquilerPublicoApi = {
  getBranding: async (): Promise<BrandingPublicoDto> => {
    const r = await publicApiClient.get<BrandingPublicoDto>(`${BASE}/branding`);
    return r.data;
  },

  getSucursalesPublicas: async (ciudad?: string): Promise<SucursalPublicaDto[]> => {
    const params = new URLSearchParams();
    if (ciudad) params.append('ciudad', ciudad);
    const query = params.toString();
    const url = query ? `${BASE}/sucursales?${query}` : `${BASE}/sucursales`;
    const r = await publicApiClient.get<SucursalPublicaDto[]>(url);
    return r.data;
  },

  getCategoriasPublicas: async (sucursalId?: string): Promise<CategoriaPublicaDto[]> => {
    const params = new URLSearchParams();
    if (sucursalId) params.append('sucursalId', sucursalId);
    const query = params.toString();
    const url = query ? `${BASE}/categorias?${query}` : `${BASE}/categorias`;
    const r = await publicApiClient.get<CategoriaPublicaDto[]>(url);
    return r.data;
  },

  buscarVehiculosDisponibles: async (params: BusquedaParams): Promise<VehiculoDisponibleDto[]> => {
    const qs = new URLSearchParams();
    qs.append('sucursalRecogidaId', params.sucursalRecogidaId);
    qs.append('fechaHoraRecogida', params.fechaHoraRecogida);
    qs.append('fechaHoraDevolucion', params.fechaHoraDevolucion);
    if (params.sucursalDevolucionId) qs.append('sucursalDevolucionId', params.sucursalDevolucionId);
    if (params.categoriaAlquiler != null) qs.append('categoriaAlquiler', String(params.categoriaAlquiler));
    const r = await publicApiClient.get<VehiculoDisponibleDto[]>(`${BASE}/vehiculos/disponibles?${qs}`);
    return r.data;
  },

  getOpciones: async (sucursalId: string, categoriaAlquiler?: number): Promise<OpcionesPublicasDto> => {
    const qs = new URLSearchParams({ sucursalId });
    if (categoriaAlquiler != null) qs.append('categoriaAlquiler', String(categoriaAlquiler));
    const r = await publicApiClient.get<OpcionesPublicasDto>(`${BASE}/opciones?${qs}`);
    return r.data;
  },

  getVehiculo: async (id: string): Promise<VehiculoAlquilerPublicoDto> => {
    const r = await publicApiClient.get<VehiculoAlquilerPublicoDto>(`${BASE}/vehiculos/${id}`);
    return r.data;
  },

  cotizar: async (body: CotizarPublicoRequest): Promise<ResultadoCotizacionDto> => {
    const r = await publicApiClient.post<ResultadoCotizacionDto>(`${BASE}/cotizar`, body);
    return r.data;
  },

  validarPromocion: async (body: ValidarPromocionPublicoRequest): Promise<ValidacionPromocionDto> => {
    const r = await publicApiClient.post<ValidacionPromocionDto>(`${BASE}/promocion/validar`, body);
    return r.data;
  },

  crearReserva: async (body: CreateReservaPublicaRequest): Promise<ReservaAlquilerDetalleDto> => {
    const r = await publicApiClient.post<ReservaAlquilerDetalleDto>(`${BASE}/reservas`, body);
    return r.data;
  },

  // Mis reservas B2C — requiere token de cliente
  getMisReservas: async (): Promise<ReservaAlquilerResumenDto[]> => {
    const r = await publicApiClient.get<ReservaAlquilerResumenDto[]>(`${BASE}/mis-reservas`);
    return r.data;
  },

  getMisReservaDetalle: async (id: string): Promise<ReservaAlquilerDetalleDto> => {
    const r = await publicApiClient.get<ReservaAlquilerDetalleDto>(`${BASE}/mis-reservas/${id}`);
    return r.data;
  },

  cancelarMiReserva: async (id: string, body: { motivoCancelacion?: string }): Promise<void> => {
    await publicApiClient.post(`${BASE}/mis-reservas/${id}/cancelar`, body);
  },
};

// Auth B2C — /api/public/v1/alquiler/auth/*
const AUTH_BASE = 'alquiler/auth';

export const authClienteApi = {
  registroCliente: (body: RegistroClienteRequest): Promise<void> =>
    publicApiClient.post(`${AUTH_BASE}/registro-cliente`, body).then(() => {}),

  loginCliente: (body: LoginClienteRequest): Promise<void> =>
    publicApiClient.post(`${AUTH_BASE}/login-cliente`, body).then(() => {}),

  verificarOtp: (body: VerificarOtpClienteRequest): Promise<AuthClienteResultDto> =>
    publicApiClient.post<AuthClienteResultDto>(`${AUTH_BASE}/verificar-otp`, body).then(r => r.data),
};
