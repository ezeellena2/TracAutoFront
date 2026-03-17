import { publicApiClient } from '../http/publicApiClient';
import type {
  PublicacionPublicaDto,
  PublicacionPublicaDetalleDto,
  ConcesionariaPublicaDto,
  FiltrosVehiculoPublico,
  FavoritoMarketplaceDto,
} from '@/shared/types/marketplace-publico';
import type { ListaPaginada } from '@/shared/types/api';

const BASE_URL = 'marketplace';

/**
 * API publica del marketplace (sin autenticacion).
 * Consume /api/public/v1/marketplace/*
 */
export const marketplacePublicoApi = {
  obtenerVehiculos: async (
    filtros?: FiltrosVehiculoPublico
  ): Promise<ListaPaginada<PublicacionPublicaDto>> => {
    const params = new URLSearchParams();

    if (filtros?.numeroPagina) params.append('numeroPagina', filtros.numeroPagina.toString());
    if (filtros?.tamanoPagina) params.append('tamanoPagina', filtros.tamanoPagina.toString());
    if (filtros?.marca) params.append('marca', filtros.marca);
    if (filtros?.modelo) params.append('modelo', filtros.modelo);
    if (filtros?.concesionariaId) params.append('concesionariaId', filtros.concesionariaId);
    if (filtros?.anioDesde) params.append('anioMinimo', filtros.anioDesde.toString());
    if (filtros?.anioHasta) params.append('anioMaximo', filtros.anioHasta.toString());
    if (filtros?.precioDesde) params.append('precioMinimo', filtros.precioDesde.toString());
    if (filtros?.precioHasta) params.append('precioMaximo', filtros.precioHasta.toString());
    if (filtros?.ordenarPor) {
      const ordenBackend = mapearOrdenamiento(filtros.ordenarPor, filtros.descendente);
      if (ordenBackend) params.append('ordenar', ordenBackend);
    }

    const query = params.toString();
    const url = query ? `${BASE_URL}/vehiculos?${query}` : `${BASE_URL}/vehiculos`;
    const response = await publicApiClient.get<ListaPaginada<PublicacionPublicaDto>>(url);
    return response.data;
  },

  obtenerVehiculoPorId: async (publicacionId: string): Promise<PublicacionPublicaDetalleDto> => {
    const response = await publicApiClient.get<PublicacionPublicaDetalleDto>(
      `${BASE_URL}/vehiculos/${publicacionId}`
    );
    return response.data;
  },

  obtenerConcesionarias: async (): Promise<ConcesionariaPublicaDto[]> => {
    const response = await publicApiClient.get<ListaPaginada<ConcesionariaPublicaDto>>(
      `${BASE_URL}/concesionarias?tamanoPagina=50`
    );
    return response.data.items;
  },

  toggleFavorito: async (publicacionId: string): Promise<boolean> => {
    const response = await publicApiClient.post<boolean>(
      `${BASE_URL}/vehiculos/${publicacionId}/favorito`
    );
    return response.data;
  },

  getMisFavoritos: async (
    numeroPagina = 1,
    tamanoPagina = 20
  ): Promise<ListaPaginada<FavoritoMarketplaceDto>> => {
    const response = await publicApiClient.get<ListaPaginada<FavoritoMarketplaceDto>>(
      `${BASE_URL}/mis-favoritos`,
      { params: { numeroPagina, tamanoPagina } }
    );
    return response.data;
  },
};

function mapearOrdenamiento(campo: string, descendente?: boolean): string | null {
  switch (campo) {
    case 'precio': return descendente ? 'precio_desc' : 'precio_asc';
    case 'anio': return 'anio_desc';
    case 'kilometraje': return 'km_asc';
    case 'fechaPublicacion': return 'fecha_desc';
    default: return null;
  }
}
