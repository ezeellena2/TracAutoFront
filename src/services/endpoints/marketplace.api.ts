import { apiClient } from '../http/apiClient';
import type {
    VehiculoMarketplaceDto,
    PublicarVehiculoRequest,
    EditarPublicacionRequest,
    CreateVehiculoMarketplaceRequest,
    VincularVehiculoMarketplaceRequest,
    ListaPaginada,
} from '@/shared/types/api';

const BASE_URL = 'marketplace';

/**
 * API para gestionar el marketplace de vehículos
 * EXCLUSIVO para organizaciones tipo ConcesionarioAutos
 */
export const marketplaceApi = {
    /**
     * Obtiene la lista paginada de vehículos con información de marketplace
     * @param params Parámetros de paginación y filtros
     */
    getVehiculosMarketplace: async (params?: {
        numeroPagina?: number;
        tamanoPagina?: number;
        patente?: string;
    }): Promise<ListaPaginada<VehiculoMarketplaceDto>> => {
        const queryParams = new URLSearchParams();

        if (params?.numeroPagina) {
            queryParams.append('numeroPagina', params.numeroPagina.toString());
        }
        if (params?.tamanoPagina) {
            queryParams.append('tamanoPagina', params.tamanoPagina.toString());
        }
        if (params?.patente) {
            queryParams.append('patente', params.patente);
        }

        const query = queryParams.toString();
        const url = query ? `${BASE_URL}/vehiculos?${query}` : `${BASE_URL}/vehiculos`;

        const response = await apiClient.get<ListaPaginada<VehiculoMarketplaceDto>>(url);
        return response.data;
    },

    /**
     * Publica un vehículo en el marketplace
     * @param vehiculoId ID del vehículo a publicar
     * @param data Datos de la publicación
     * @returns ID de la publicación creada
     */
    publicarVehiculo: async (
        vehiculoId: string,
        data: PublicarVehiculoRequest
    ): Promise<string> => {
        const response = await apiClient.post<string>(
            `${BASE_URL}/vehiculos/${vehiculoId}/publicar`,
            data
        );
        return response.data;
    },

    /**
     * Edita una publicación existente
     * @param publicacionId ID de la publicación
     * @param data Datos actualizados
     */
    editarPublicacion: async (
        publicacionId: string,
        data: EditarPublicacionRequest
    ): Promise<void> => {
        await apiClient.put(
            `${BASE_URL}/publicaciones/${publicacionId}`,
            data
        );
    },

    /**
     * Crea un vehículo directamente en el marketplace (sin vehículo operativo asociado)
     * @param data Datos del vehículo a crear
     * @returns ID de la publicación creada
     */
    createVehiculoMarketplace: async (
        data: CreateVehiculoMarketplaceRequest
    ): Promise<string> => {
        const response = await apiClient.post<string>(
            `${BASE_URL}/vehiculos`,
            data
        );
        return response.data;
    },

    /**
     * Vincula un vehículo del marketplace a un vehículo/dispositivo/conductor existente
     * @param publicacionId ID de la publicación a vincular
     * @param data Datos de vinculación
     * @returns ID del vehículo vinculado
     */
    vincularVehiculoMarketplace: async (
        publicacionId: string,
        data: VincularVehiculoMarketplaceRequest
    ): Promise<string> => {
        const response = await apiClient.post<string>(
            `${BASE_URL}/publicaciones/${publicacionId}/vincular`,
            data
        );
        return response.data;
    },
};
