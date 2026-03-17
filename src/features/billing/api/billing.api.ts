import { apiClient } from '@/services/http/apiClient';
import type {
  SuscripcionDto,
  PlanModuloDto,
  ModuloActivoDto,
  ModuloDisponibleDto,
  CheckoutSessionDto,
  LimitesModuloDto,
  CrearSuscripcionRequest,
} from '../types';

const BASE_SUSCRIPCIONES = 'suscripciones';
const BASE_MODULOS = 'organizacion/modulos';

export const billingApi = {
  // --- Suscripcion ---

  getSuscripcionActual: async (): Promise<SuscripcionDto | null> => {
    const response = await apiClient.get<SuscripcionDto | null>(`${BASE_SUSCRIPCIONES}/actual`);
    return response.data;
  },

  getPlanes: async (): Promise<PlanModuloDto[]> => {
    const response = await apiClient.get<PlanModuloDto[]>(`${BASE_SUSCRIPCIONES}/planes`);
    return response.data;
  },

  crearSuscripcion: async (request: CrearSuscripcionRequest): Promise<SuscripcionDto> => {
    const response = await apiClient.post<SuscripcionDto>(BASE_SUSCRIPCIONES, request);
    return response.data;
  },

  cancelarSuscripcion: async (motivoCancelacion?: string): Promise<void> => {
    await apiClient.post(`${BASE_SUSCRIPCIONES}/cancelar`, { motivoCancelacion });
  },

  reactivarSuscripcion: async (): Promise<void> => {
    await apiClient.post(`${BASE_SUSCRIPCIONES}/reactivar`);
  },

  crearCheckoutSession: async (successUrl: string, cancelUrl: string): Promise<CheckoutSessionDto> => {
    const response = await apiClient.post<CheckoutSessionDto>(`${BASE_SUSCRIPCIONES}/checkout-session`, {
      successUrl,
      cancelUrl,
    });
    return response.data;
  },

  crearBillingPortalSession: async (returnUrl: string): Promise<CheckoutSessionDto> => {
    const response = await apiClient.post<CheckoutSessionDto>(`${BASE_SUSCRIPCIONES}/billing-portal`, {
      returnUrl,
    });
    return response.data;
  },

  // --- Uso vs Límites ---

  getUsoModulos: async (): Promise<LimitesModuloDto[]> => {
    const response = await apiClient.get<LimitesModuloDto[]>(`${BASE_SUSCRIPCIONES}/uso`);
    return response.data;
  },

  // --- Modulos ---

  getModulosActivos: async (): Promise<ModuloActivoDto[]> => {
    const response = await apiClient.get<ModuloActivoDto[]>(BASE_MODULOS);
    return response.data;
  },

  getModulosDisponibles: async (): Promise<ModuloDisponibleDto[]> => {
    const response = await apiClient.get<ModuloDisponibleDto[]>(`${BASE_MODULOS}/disponibles`);
    return response.data;
  },

  activarModulo: async (codigo: number): Promise<void> => {
    await apiClient.post(`${BASE_MODULOS}/${codigo}/activar`);
  },

  desactivarModulo: async (codigo: number): Promise<void> => {
    await apiClient.post(`${BASE_MODULOS}/${codigo}/desactivar`);
  },
};
