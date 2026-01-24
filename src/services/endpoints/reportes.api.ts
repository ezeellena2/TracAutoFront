/**
 * Reportes API Service
 * Endpoints for Excel import/export operations
 */

import { apiClient } from '../http/apiClient';

const REPORTES_BASE = 'reportes';

/**
 * Response from Excel import operation
 */
export interface ImportarExcelResponse {
  totalFilas: number;
  filasExitosas: number;
  filasConErrores: number;
  errores: ErrorFilaImportacion[];
}

/**
 * Error found in a specific row during import
 */
export interface ErrorFilaImportacion {
  numeroFila: number;
  tipoEntidad: string;
  identificador: string;
  mensaje: string;
  campo: string | null;
}

/**
 * Type of import operation
 */
export enum TipoImportacion {
  Vehiculos = 'vehiculos',
  Conductores = 'conductores',
  Dispositivos = 'dispositivos',
}

/**
 * Estado de un job de importación
 */
export enum EstadoImportacionJob {
  Pendiente = 0,
  Procesando = 1,
  Completado = 2,
  Fallido = 3,
}

/**
 * DTO para un job de importación
 */
export interface ImportacionJobDto {
  id: string;
  tipoImportacion: string;
  estado: EstadoImportacionJob;
  nombreArchivo: string;
  totalFilas: number | null;
  filasExitosas: number | null;
  filasConErrores: number | null;
  mensajeError: string | null;
  errores: ErrorFilaImportacion[] | null;
  fechaInicioProcesamiento: string | null;
  fechaFinProcesamiento: string | null;
  fechaCreacion: string;
  usuarioId: string | null;
}

/**
 * Export vehicles to Excel
 */
export async function exportVehiculosExcel(soloActivos: boolean = true): Promise<Blob> {
  const response = await apiClient.get(`${REPORTES_BASE}/vehiculos/excel`, {
    responseType: 'blob',
    params: { soloActivos },
  });
  return response.data;
}

/**
 * Export conductors to Excel
 */
export async function exportConductoresExcel(soloActivos: boolean = true): Promise<Blob> {
  const response = await apiClient.get(`${REPORTES_BASE}/conductores/excel`, {
    responseType: 'blob',
    params: { soloActivos },
  });
  return response.data;
}

/**
 * Export devices to Excel
 */
export async function exportDispositivosExcel(soloActivos: boolean = true): Promise<Blob> {
  const response = await apiClient.get(`${REPORTES_BASE}/dispositivos/excel`, {
    responseType: 'blob',
    params: { soloActivos },
  });
  return response.data;
}

/**
 * Download template Excel for vehicles import
 */
export async function downloadTemplateVehiculosExcel(): Promise<Blob> {
  const response = await apiClient.get(`${REPORTES_BASE}/vehiculos/excel/template`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Download template Excel for conductors import
 */
export async function downloadTemplateConductoresExcel(): Promise<Blob> {
  const response = await apiClient.get(`${REPORTES_BASE}/conductores/excel/template`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Download template Excel for devices import
 */
export async function downloadTemplateDispositivosExcel(): Promise<Blob> {
  const response = await apiClient.get(`${REPORTES_BASE}/dispositivos/excel/template`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Import vehicles from Excel file
 */
export async function importVehiculosExcel(file: File): Promise<ImportarExcelResponse> {
  const formData = new FormData();
  formData.append('archivo', file);

  const response = await apiClient.post<ImportarExcelResponse>(
    `${REPORTES_BASE}/vehiculos/excel/importar`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes timeout for large files
    }
  );
  return response.data;
}

/**
 * Import conductors from Excel file
 */
export async function importConductoresExcel(file: File): Promise<ImportarExcelResponse> {
  const formData = new FormData();
  formData.append('archivo', file);

  const response = await apiClient.post<ImportarExcelResponse>(
    `${REPORTES_BASE}/conductores/excel/importar`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes timeout for large files
    }
  );
  return response.data;
}

/**
 * Import devices from Excel file
 */
export async function importDispositivosExcel(file: File): Promise<ImportarExcelResponse> {
  const formData = new FormData();
  formData.append('archivo', file);

  const response = await apiClient.post<ImportarExcelResponse>(
    `${REPORTES_BASE}/dispositivos/excel/importar`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes timeout for large files
    }
  );
  return response.data;
}

/**
 * List import jobs with pagination and optional filters
 */
export async function listarImportacionJobs(params?: {
  numeroPagina?: number;
  tamanoPagina?: number;
  tipoImportacion?: string;
  estado?: EstadoImportacionJob;
}): Promise<import('@/shared/types/api').ListaPaginada<ImportacionJobDto>> {
  const response = await apiClient.get<import('@/shared/types/api').ListaPaginada<ImportacionJobDto>>(
    `${REPORTES_BASE}/importaciones/jobs`,
    {
      params: {
        numeroPagina: params?.numeroPagina ?? 1,
        tamanoPagina: params?.tamanoPagina ?? 10,
        tipoImportacion: params?.tipoImportacion,
        estado: params?.estado,
      },
    }
  );
  return response.data;
}

/**
 * Get a specific import job by ID
 */
export async function obtenerImportacionJob(id: string): Promise<ImportacionJobDto> {
  const response = await apiClient.get<ImportacionJobDto>(`${REPORTES_BASE}/importaciones/jobs/${id}`);
  return response.data;
}

/**
 * API object with all reportes functions
 */
export const reportesApi = {
  exportVehiculosExcel,
  exportConductoresExcel,
  exportDispositivosExcel,
  downloadTemplateVehiculosExcel,
  downloadTemplateConductoresExcel,
  downloadTemplateDispositivosExcel,
  importVehiculosExcel,
  importConductoresExcel,
  importDispositivosExcel,
  listarImportacionJobs,
  obtenerImportacionJob,
};
