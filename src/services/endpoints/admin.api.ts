/**
 * Servicio de endpoints de administración (SuperAdmin)
 * Conecta con AdminDashboardController y AdminSuscripcionesController
 */

import { apiClient } from '../http/apiClient';
import type { ListaPaginada, PaginacionParams } from '@/shared/types/api';

// ─── Types ───

export interface AdminDashboardStatsDto {
  organizacionesTotales: number;
  organizacionesActivas: number;
  organizacionesNuevasDelMes: number;
  suscripcionesActivas: number;
  suscripcionesTrial: number;
  suscripcionesExpiradas: number;
  suscripcionesCanceladas: number;
  suscripcionesPendienteVerificacion: number;
  suscripcionesNormales: number;
  suscripcionesDemo: number;
  suscripcionesCortesia: number;
  gatewayStripe: number;
  gatewayMercadoPago: number;
  gatewayTransferencia: number;
  gatewayNinguno: number;
  ingresoMensualRecurrente: number;
  transferenciasPendientes: number;
  trialsPorVencer7Dias: number;
}

export interface AdminOrganizacionResumenDto {
  organizacionId: string;
  nombre: string;
  cuit: string | null;
  activa: boolean;
  fechaCreacion: string;
  estadoSuscripcion: string | null;
  tipoSuscripcion: string | null;
  gateway: string | null;
  requierePago: boolean | null;
  moneda: string | null;
  montoMensual: number | null;
  fechaFinTrial: string | null;
  modulosActivos: number;
  cantidadUsuarios: number;
}

export interface TransferenciaPendienteDto {
  organizacionId: string;
  nombreOrganizacion: string;
  suscripcionId: string;
  comprobanteUrl: string | null;
  montoMensual: number;
  moneda: string;
  cantidadModulos: number;
  fechaSolicitud: string;
}

export interface PagoFallidoAdminDto {
  organizacionId: string;
  nombreOrganizacion: string;
  suscripcionId: string;
  gateway: number;
  montoMensual: number;
  moneda: string;
  descripcion: string | null;
  fechaEvento: string;
}

export interface TrialPorVencerAdminDto {
  organizacionId: string;
  nombreOrganizacion: string;
  suscripcionId: string;
  gateway: number;
  cantidadModulos: number;
  cantidadUsuarios: number;
  fechaFinTrial: string;
  diasRestantes: number;
}

export interface HistorialSuscripcionAdminDto {
  id: string;
  tipoEvento: number;
  descripcion: string | null;
  metadataJson: string | null;
  fechaEvento: string;
  usuarioId: string | null;
  nombreUsuario: string | null;
}

export interface AdminAnalyticsDto {
  mrrMensual: MrrMensualDto[];
  nuevasOrgsPorMes: NuevasOrgsMesDto[];
  suscripcionesPorEstado: SuscripcionesPorEstadoDto[];
  ingresoPorGateway: IngresoPorGatewayDto[];
  churnMensual: ChurnMensualDto[];
}

export interface MrrMensualDto {
  mes: string;
  mrr: number;
}

export interface NuevasOrgsMesDto {
  mes: string;
  cantidad: number;
}

export interface SuscripcionesPorEstadoDto {
  estado: string;
  cantidad: number;
}

export interface IngresoPorGatewayDto {
  gateway: string;
  monto: number;
}

export interface ChurnMensualDto {
  mes: string;
  tasa: number;
}

export interface ModuloDefinicionAdminDto {
  id: string;
  codigo: number;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
  requiereModulos: string | null;
  esBase: boolean;
  esGratis: boolean;
  visible: boolean;
  activo: boolean;
}

export interface ActualizarModuloDefinicionRequest {
  esGratis?: boolean;
  visible?: boolean;
  activo?: boolean;
}

// ─── API Calls ───

const ADMIN_DASHBOARD = 'admin/dashboard';
const ADMIN_SUSCRIPCIONES = 'admin/suscripciones';
const ADMIN_MODULOS = 'admin/modulos';

export async function getAdminStats(): Promise<AdminDashboardStatsDto> {
  const response = await apiClient.get<AdminDashboardStatsDto>(
    `${ADMIN_DASHBOARD}/stats`
  );
  return response.data;
}

export async function getAdminOrganizaciones(
  params: PaginacionParams & { filtroNombre?: string; soloActivas?: boolean } = {}
): Promise<ListaPaginada<AdminOrganizacionResumenDto>> {
  const response = await apiClient.get<ListaPaginada<AdminOrganizacionResumenDto>>(
    `${ADMIN_DASHBOARD}/organizaciones`,
    { params }
  );
  return response.data;
}

export async function getTransferenciasPendientes(): Promise<TransferenciaPendienteDto[]> {
  const response = await apiClient.get<TransferenciaPendienteDto[]>(
    `${ADMIN_DASHBOARD}/transferencias-pendientes`
  );
  return response.data;
}

export async function aprobarTransferencia(organizacionId: string): Promise<void> {
  await apiClient.post(
    `${ADMIN_SUSCRIPCIONES}/${organizacionId}/transferencia/aprobar`
  );
}

export async function rechazarTransferencia(
  organizacionId: string,
  motivo: string
): Promise<void> {
  await apiClient.post(
    `${ADMIN_SUSCRIPCIONES}/${organizacionId}/transferencia/rechazar`,
    { motivo }
  );
}

export async function crearSuscripcionDemo(data: {
  organizacionId: string;
  tipoSuscripcion: number;
  modulos?: string[];
  motivoExencion: string;
  diasDuracion?: number;
  moneda?: string;
}): Promise<void> {
  await apiClient.post(`${ADMIN_SUSCRIPCIONES}/demo`, data);
}

export async function extenderTrial(
  organizacionId: string,
  data: { diasExtension: number; motivo: string }
): Promise<void> {
  await apiClient.put(
    `${ADMIN_SUSCRIPCIONES}/${organizacionId}/extender-trial`,
    data
  );
}

export async function forzarEstadoSuscripcion(
  organizacionId: string,
  data: { nuevoEstado: number; motivo: string }
): Promise<void> {
  await apiClient.put(
    `${ADMIN_SUSCRIPCIONES}/${organizacionId}/forzar-estado`,
    data
  );
}

export async function getPagosFallidos(): Promise<PagoFallidoAdminDto[]> {
  const response = await apiClient.get<PagoFallidoAdminDto[]>(
    `${ADMIN_DASHBOARD}/pagos-fallidos`
  );
  return response.data;
}

export async function getTrialsPorVencer(): Promise<TrialPorVencerAdminDto[]> {
  const response = await apiClient.get<TrialPorVencerAdminDto[]>(
    `${ADMIN_DASHBOARD}/trials-por-vencer`
  );
  return response.data;
}

export async function getHistorialSuscripcion(
  organizacionId: string
): Promise<HistorialSuscripcionAdminDto[]> {
  const response = await apiClient.get<HistorialSuscripcionAdminDto[]>(
    `${ADMIN_DASHBOARD}/historial/${organizacionId}`
  );
  return response.data;
}

export async function getAnalytics(): Promise<AdminAnalyticsDto> {
  const response = await apiClient.get<AdminAnalyticsDto>(
    `${ADMIN_DASHBOARD}/analytics`
  );
  return response.data;
}

export async function getModulosDefinicion(): Promise<ModuloDefinicionAdminDto[]> {
  const response = await apiClient.get<ModuloDefinicionAdminDto[]>(ADMIN_MODULOS);
  return response.data;
}

export async function actualizarModuloDefinicion(
  codigo: number,
  data: ActualizarModuloDefinicionRequest
): Promise<ModuloDefinicionAdminDto> {
  const response = await apiClient.patch<ModuloDefinicionAdminDto>(
    `${ADMIN_MODULOS}/${codigo}`,
    data
  );
  return response.data;
}

export const adminApi = {
  getAdminStats,
  getAdminOrganizaciones,
  getTransferenciasPendientes,
  aprobarTransferencia,
  rechazarTransferencia,
  crearSuscripcionDemo,
  extenderTrial,
  forzarEstadoSuscripcion,
  getPagosFallidos,
  getTrialsPorVencer,
  getHistorialSuscripcion,
  getAnalytics,
  getModulosDefinicion,
  actualizarModuloDefinicion,
};
