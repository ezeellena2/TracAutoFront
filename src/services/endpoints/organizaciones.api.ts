/**
 * Servicio de endpoints de organizaciones
 * Conecta con OrganizacionesController del backend
 */

import { apiClient } from '../http/apiClient';
import { useAuthStore } from '@/store';
import { 
  OrganizacionDto, 
  ListaPaginada, 
  PaginacionParams,
  UsuarioOrganizacionDto,
  CambiarRolRequest,
  OrganizacionThemeDto,
  OrganizacionRelacionDto
} from '@/shared/types/api';

const ORGANIZACIONES_BASE = 'organizaciones';

/**
 * Obtiene el organizationId del store de autenticación
 */
function getOrganizationId(): string {
  const orgId = useAuthStore.getState().organizationId;
  if (!orgId) {
    throw new Error('No hay organización activa');
  }
  return orgId;
}

/**
 * Obtiene lista paginada de organizaciones
 * Requiere autenticación
 */
export async function getOrganizaciones(
  params: PaginacionParams & { filtroNombre?: string; soloActivas?: boolean } = {}
): Promise<ListaPaginada<OrganizacionDto>> {
  const response = await apiClient.get<ListaPaginada<OrganizacionDto>>(
    ORGANIZACIONES_BASE,
    { params }
  );
  return response.data;
}

// ==================== Usuarios de Organización ====================

/**
 * Obtiene los usuarios de la organización actual con paginación
 * El orgId se obtiene automáticamente del store
 */
export async function getUsuariosOrganizacion(
  params: PaginacionParams = {}
): Promise<ListaPaginada<UsuarioOrganizacionDto>> {
  const orgId = getOrganizationId();
  const { numeroPagina = 1, tamanoPagina = 10 } = params;
  
  const response = await apiClient.get<ListaPaginada<UsuarioOrganizacionDto>>(
    `${ORGANIZACIONES_BASE}/${orgId}/usuarios`,
    { params: { numeroPagina, tamanoPagina } }
  );
  return response.data;
}

/**
 * Cambia el rol de un usuario en la organización actual
 */
export async function cambiarRolUsuario(
  userId: string, 
  nuevoRol: 'Admin' | 'Operador' | 'Analista'
): Promise<void> {
  const orgId = getOrganizationId();
  
  await apiClient.put<void>(
    `${ORGANIZACIONES_BASE}/${orgId}/usuarios/${userId}/rol`,
    { nuevoRol } as CambiarRolRequest
  );
}

/**
 * Remueve un usuario de la organización actual
 */
export async function removerUsuario(userId: string): Promise<void> {
  const orgId = getOrganizationId();
  
  await apiClient.delete(`${ORGANIZACIONES_BASE}/${orgId}/usuarios/${userId}`);
}

/**
 * Obtiene una organización por su ID
 * Incluye el theme si está disponible
 */
export async function getOrganizacionById(orgId: string): Promise<OrganizacionDto> {
  const response = await apiClient.get<OrganizacionDto>(
    `${ORGANIZACIONES_BASE}/${orgId}`
  );
  return response.data;
}

/**
 * Actualiza el theme/branding de una organización (patch parcial).
 * Envía SOLO los campos modificados.
 */
export async function updateOrganizacionTheme(
  orgId: string,
  patch: Partial<Record<keyof OrganizacionThemeDto, string | null>>
): Promise<OrganizacionThemeDto> {
  const response = await apiClient.put<OrganizacionThemeDto>(
    `${ORGANIZACIONES_BASE}/${orgId}/theme`,
    patch
  );
  return response.data;
}

/**
 * DTO de preferencias de localización efectivas
 */
export interface LocalizationPreferencesDto {
  timeZoneId: string;           // IANA timezone ID (ej: "America/Argentina/Buenos_Aires")
  culture: string;               // Culture code (ej: "es-AR", "en-US")
  measurementSystem: number;     // 0=Metric, 1=Imperial
  country: number | null;        // Enum Country (puede ser null)
}

/**
 * Obtiene las preferencias de localización efectivas del usuario/organización actual.
 * Resuelve: Usuario override → Organización → CountryDefaults → Fallback
 */
export async function getCurrentOrganizationPreferences(): Promise<LocalizationPreferencesDto> {
  const response = await apiClient.get<LocalizationPreferencesDto>(
    `${ORGANIZACIONES_BASE}/current/preferences`
  );
  return response.data;
}

// ==================== Relaciones entre Organizaciones ====================

/**
 * Obtiene organizaciones disponibles para vincular
 * Excluye la organización actual y las organizaciones ya vinculadas
 */
export async function getOrganizacionesDisponiblesParaVincular(
  params: PaginacionParams & { 
    tipoFiltro?: number; 
    filtroNombre?: string 
  } = {}
): Promise<ListaPaginada<OrganizacionDto>> {
  const orgId = getOrganizationId();
  const { numeroPagina = 1, tamanoPagina = 50, tipoFiltro, filtroNombre } = params;
  
  const response = await apiClient.get<ListaPaginada<OrganizacionDto>>(
    `${ORGANIZACIONES_BASE}/${orgId}/relaciones/disponibles`,
    { params: { numeroPagina, tamanoPagina, tipoFiltro, filtroNombre } }
  );
  return response.data;
}

/**
 * Crea una relación entre dos organizaciones
 */
export async function crearRelacionOrganizacion(
  organizacionAId: string,
  organizacionBId: string,
  tipoRelacion?: string,
  asignacionAutomaticaRecursos?: boolean
): Promise<OrganizacionRelacionDto> {
  const orgId = getOrganizationId();
  
  const response = await apiClient.post<OrganizacionRelacionDto>(
    `${ORGANIZACIONES_BASE}/${orgId}/relaciones`,
    {
      organizacionAId,
      organizacionBId,
      tipoRelacion,
      asignacionAutomaticaRecursos
    }
  );
  return response.data;
}

/**
 * Lista las relaciones de una organización con paginación
 */
export async function listarRelacionesOrganizacion(
  params: PaginacionParams & { soloActivas?: boolean } = {}
): Promise<ListaPaginada<OrganizacionRelacionDto>> {
  const orgId = getOrganizationId();
  const { numeroPagina = 1, tamanoPagina = 10, soloActivas } = params;
  
  const response = await apiClient.get<ListaPaginada<OrganizacionRelacionDto>>(
    `${ORGANIZACIONES_BASE}/${orgId}/relaciones`,
    { params: { numeroPagina, tamanoPagina, soloActivas } }
  );
  return response.data;
}

/**
 * Elimina (soft delete) una relación entre organizaciones
 */
export async function eliminarRelacionOrganizacion(
  relacionId: string
): Promise<void> {
  const orgId = getOrganizationId();
  
  await apiClient.delete(`${ORGANIZACIONES_BASE}/${orgId}/relaciones/${relacionId}`);
}

/**
 * Asigna recursos manualmente a una relación entre organizaciones
 */
export async function asignarRecursosARelacion(
  relacionId: string,
  recursos: {
    vehiculoIds?: string[];
    conductorIds?: string[];
    dispositivoIds?: string[];
  }
): Promise<void> {
  const orgId = getOrganizationId();
  
  await apiClient.post(
    `${ORGANIZACIONES_BASE}/${orgId}/relaciones/${relacionId}/asignar-recursos`,
    recursos
  );
}

export const organizacionesApi = {
  getOrganizaciones,
  getOrganizacionById,
  getUsuariosOrganizacion,
  cambiarRolUsuario,
  removerUsuario,
  updateOrganizacionTheme,
  getCurrentOrganizationPreferences,
  getOrganizacionesDisponiblesParaVincular,
  crearRelacionOrganizacion,
  listarRelacionesOrganizacion,
  eliminarRelacionOrganizacion,
  asignarRecursosARelacion,
};
