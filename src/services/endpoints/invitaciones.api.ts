/**
 * Servicio de endpoints de invitaciones
 * Conecta con InvitacionesController del backend
 */

import { apiClient } from '../http/apiClient';
import { shouldUseMocks } from '../mock';
import { useAuthStore } from '@/store';
import { 
  InvitacionDto,
  CreateInvitacionRequest,
  AceptarInvitacionRequest,
  AceptarInvitacionResponse,
  ListaPaginada,
  PaginacionParams
} from '@/shared/types/api';

const ORGANIZACIONES_BASE = 'organizaciones';
const INVITACIONES_BASE = 'invitaciones';

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

// ==================== Invitaciones (requiere auth) ====================

/**
 * Crea una invitación para un usuario
 * El orgId se obtiene automáticamente del store
 */
export async function createInvitacion(
  email: string,
  rolAsignado: 'Admin' | 'Operador' | 'Analista' = 'Analista'
): Promise<InvitacionDto> {
  const orgId = getOrganizationId();
  
  if (shouldUseMocks()) {
    await new Promise(r => setTimeout(r, 500));
    return {
      id: `inv-${Date.now()}`,
      email,
      organizacionId: orgId,
      nombreOrganizacion: 'Mock Organization',
      rolAsignado,
      estado: 'Pendiente',
      fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      fechaCreacion: new Date().toISOString(),
      fechaAceptacion: null,
    };
  }

  const response = await apiClient.post<InvitacionDto>(
    `${ORGANIZACIONES_BASE}/${orgId}/invitaciones`,
    { email, rolAsignado } as CreateInvitacionRequest
  );
  return response.data;
}

/**
 * Obtiene las invitaciones pendientes de la organización actual con paginación
 */
export async function getInvitacionesPendientes(
  params: PaginacionParams = {}
): Promise<ListaPaginada<InvitacionDto>> {
  const orgId = getOrganizationId();
  const { numeroPagina = 1, tamanoPagina = 10 } = params;
  
  if (shouldUseMocks()) {
    await new Promise(r => setTimeout(r, 500));
    const mockInvitaciones: InvitacionDto[] = [
      {
        id: 'inv-1',
        email: 'usuario1@ejemplo.com',
        organizacionId: orgId,
        nombreOrganizacion: 'Mock Organization',
        rolAsignado: 'Analista',
        estado: 'Pendiente',
        fechaExpiracion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        fechaCreacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fechaAceptacion: null,
      },
    ];
    return {
      items: mockInvitaciones,
      paginaActual: 1,
      tamanoPagina: mockInvitaciones.length,
      totalPaginas: 1,
      totalRegistros: mockInvitaciones.length,
    };
  }

  const response = await apiClient.get<ListaPaginada<InvitacionDto>>(
    `${ORGANIZACIONES_BASE}/${orgId}/invitaciones`,
    { params: { numeroPagina, tamanoPagina } }
  );
  return response.data;
}

/**
 * Reenvía una invitación pendiente
 */
export async function reenviarInvitacion(invitacionId: string): Promise<boolean> {
  const orgId = getOrganizationId();
  
  if (shouldUseMocks()) {
    await new Promise(r => setTimeout(r, 500));
    return true;
  }

  const response = await apiClient.post<boolean>(
    `${ORGANIZACIONES_BASE}/${orgId}/invitaciones/${invitacionId}/reenviar`
  );
  return response.data;
}

/**
 * Cancela una invitación pendiente
 */
export async function cancelInvitacion(invitacionId: string): Promise<void> {
  const orgId = getOrganizationId();
  
  if (shouldUseMocks()) {
    await new Promise(r => setTimeout(r, 500));
    return;
  }

  await apiClient.delete(`${INVITACIONES_BASE}/${invitacionId}?orgId=${orgId}`);
}

// ==================== Invitaciones Públicas (sin auth) ====================

/**
 * Valida un token de invitación
 * Endpoint público - no requiere autenticación
 */
export async function validarInvitacion(token: string): Promise<InvitacionDto> {
  if (shouldUseMocks()) {
    await new Promise(r => setTimeout(r, 500));
    
    // Simular diferentes estados para testing
    if (token === 'expired') {
      throw {
        response: {
          status: 400,
          data: { code: 'Invitacion.Expirada', detail: 'La invitación ha expirado' }
        }
      };
    }
    if (token === 'invalid') {
      throw {
        response: {
          status: 404,
          data: { code: 'Invitacion.TokenInvalido', detail: 'Token inválido' }
        }
      };
    }
    
    return {
      id: 'inv-mock',
      email: 'invitado@test.com',
      organizacionId: 'org-mock',
      nombreOrganizacion: 'SegurosTech',
      rolAsignado: 'Analista',
      estado: 'Pendiente',
      fechaExpiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      fechaCreacion: new Date().toISOString(),
      fechaAceptacion: null,
    };
  }

  const response = await apiClient.get<InvitacionDto>(
    `${INVITACIONES_BASE}/${token}`
  );
  return response.data;
}

/**
 * Acepta una invitación y crea/vincula usuario
 * Endpoint público - no requiere autenticación
 */
export async function aceptarInvitacion(
  token: string,
  data: AceptarInvitacionRequest
): Promise<AceptarInvitacionResponse> {
  if (shouldUseMocks()) {
    await new Promise(r => setTimeout(r, 1000));
    return {
      usuarioId: `user-${Date.now()}`,
      organizacionId: 'org-mock',
      nombreOrganizacion: 'SegurosTech',
      rol: 'Analista',
      mensaje: 'Usuario creado y vinculado exitosamente'
    };
  }

  const response = await apiClient.post<AceptarInvitacionResponse>(
    `${INVITACIONES_BASE}/${token}/aceptar`,
    data
  );
  return response.data;
}

export const invitacionesApi = {
  // Con autenticación
  createInvitacion,
  cancelInvitacion,
  getInvitacionesPendientes,
  reenviarInvitacion,
  // Públicos
  validarInvitacion,
  aceptarInvitacion,
};
