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
  CambiarRolRequest
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
          tipo: 1,
          activa: true,
          fechaCreacion: new Date().toISOString(),
          logoUrl: null,
        },
      ],
      numeroPagina: 1,
      tamanoPagina: 10,
      totalPaginas: 1,
      totalItems: 1,
      tienePaginaAnterior: false,
      tienePaginaSiguiente: false,
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
  getUsuariosOrganizacion,
  cambiarRolUsuario,
  removerUsuario,
  cambiarEstadoUsuario,
};
