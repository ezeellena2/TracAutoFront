import { apiClient } from '../http/apiClient';

// ── DTOs ────────────────────────────────────────────────────
export interface FeriadoDto {
    fecha: string;
    tipo: string;
    nombre: string;
}

export interface FeriadosResumenDto {
    esHoyFeriado: boolean;
    hoyNombre: string | null;
    proximoFeriadoFecha: string | null;
    proximoFeriadoNombre: string | null;
    proximoFeriadoTipo: string | null;
}

// ── API functions ───────────────────────────────────────────
export const feriadosApi = {
    getFeriadosResumen: async (): Promise<FeriadosResumenDto> => {
        const { data } = await apiClient.get<FeriadosResumenDto>('/feriados/resumen');
        return data;
    },

    getFeriados: async (anio?: number): Promise<FeriadoDto[]> => {
        const params = anio ? { anio } : {};
        const { data } = await apiClient.get<FeriadoDto[]>('/feriados', { params });
        return data;
    },
};
