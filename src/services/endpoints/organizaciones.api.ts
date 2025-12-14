/**
 * Servicio de endpoints de organizaciones
 * Conecta con OrganizacionesController del backend
 */

import { apiClient } from '../http/apiClient';
import { shouldUseMocks } from '../mock';
import { 
  OrganizacionDto, 
  ListaPaginada, 
  PaginacionParams 
} from '@/shared/types/api';

const ORGANIZACIONES_BASE = 'organizaciones';

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
        {
          id: 'org-autoprotect',
          nombre: 'AutoProtect',
          razonSocial: 'AutoProtect S.R.L.',
          cuit: '30-98765432-1',
          tipo: 1,
          activa: true,
          fechaCreacion: new Date().toISOString(),
          logoUrl: null,
        },
      ],
      numeroPagina: 1,
      tamanoPagina: 10,
      totalPaginas: 1,
      totalItems: 2,
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

export const organizacionesApi = {
  getOrganizaciones,
};
