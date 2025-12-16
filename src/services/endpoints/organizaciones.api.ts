/**
 * Servicio de endpoints de organizaciones
 * Conecta con OrganizacionesController del backend
 */

import { apiClient } from '../http/apiClient';
import { shouldUseMocks } from '../mock';
import { useAuthStore } from '@/store';
import { 
  OrganizacionDto, 
  ListaPaginada, 
  PaginacionParams,
  UsuarioOrganizacionDto,
  CambiarRolRequest,
  OrganizacionThemeDto
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
  if (shouldUseMocks()) {
    // Mock fallback
    return {
      items: [
        {
          id: 'org-segurostech',
          nombre: 'SegurosTech',
          razonSocial: 'SegurosTech S.A.',
          cuit: '30-12345678-9',
          tipoOrganizacion: 2, // Aseguradora
          activa: true,
          fechaCreacion: new Date().toISOString(),
        },
      ],
      paginaActual: 1,
      tamanoPagina: 10,
      totalPaginas: 1,
      totalRegistros: 1,
    };
  }

  const response = await apiClient.get<ListaPaginada<OrganizacionDto>>(
    ORGANIZACIONES_BASE,
    { params }
  );
  return response.data;
}

// ==================== Usuarios de Organización ====================

/**
 * Obtiene los usuarios de la organización actual
 * El orgId se obtiene automáticamente del store
 */
export async function getUsuariosOrganizacion(): Promise<UsuarioOrganizacionDto[]> {
  const orgId = getOrganizationId();
  
  if (shouldUseMocks()) {
    return [
      {
        usuarioId: 'user-1',
        email: 'admin@segurostech.com',
        nombreCompleto: 'Juan Admin',
        rol: 'Admin',
        esDuenio: true,
        activo: true,
        fechaAsignacion: new Date().toISOString(),
      },
      {
        usuarioId: 'user-2',
        email: 'operador@segurostech.com',
        nombreCompleto: 'María Operador',
        rol: 'Operador',
        esDuenio: false,
        activo: true,
        fechaAsignacion: new Date().toISOString(),
      },
    ];
  }

  const response = await apiClient.get<UsuarioOrganizacionDto[]>(
    `${ORGANIZACIONES_BASE}/${orgId}/usuarios`
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
  
  if (shouldUseMocks()) {
    await new Promise(r => setTimeout(r, 500));
    return;
  }

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
  
  if (shouldUseMocks()) {
    await new Promise(r => setTimeout(r, 500));
    return;
  }

  await apiClient.delete(`${ORGANIZACIONES_BASE}/${orgId}/usuarios/${userId}`);
}

/**
 * Obtiene una organización por su ID
 * Incluye el theme si está disponible
 */
export async function getOrganizacionById(orgId: string): Promise<OrganizacionDto> {
  if (shouldUseMocks()) {
    // Mock fallback - retornar organización demo sin theme
    return {
      id: orgId,
      nombre: 'SegurosTech',
      razonSocial: 'SegurosTech S.A.',
      cuit: '30-12345678-9',
      tipoOrganizacion: 2, // Aseguradora
      activa: true,
      fechaCreacion: new Date().toISOString(),
      // theme no incluido en mock - usar fallback
    };
  }

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
  if (shouldUseMocks()) {
    await new Promise(r => setTimeout(r, 400));
    // Mock simple: devolver el patch como "theme result"
    return patch as OrganizacionThemeDto;
  }

  const response = await apiClient.put<OrganizacionThemeDto>(
    `${ORGANIZACIONES_BASE}/${orgId}/theme`,
    patch
  );
  return response.data;
}

/**
 * Cambia el estado (habilitar/deshabilitar) de un usuario
 */
export async function cambiarEstadoUsuario(
  userId: string,
  activo: boolean
): Promise<void> {
  const orgId = getOrganizationId();

  if (shouldUseMocks()) {
    await new Promise(r => setTimeout(r, 500));
    return;
  }

  await apiClient.put(
    `${ORGANIZACIONES_BASE}/${orgId}/usuarios/${userId}/estado`,
    { activo }
  );
}

export const organizacionesApi = {
  getOrganizaciones,
  getOrganizacionById,
  getUsuariosOrganizacion,
  cambiarRolUsuario,
  removerUsuario,
  cambiarEstadoUsuario,
  updateOrganizacionTheme,
};
