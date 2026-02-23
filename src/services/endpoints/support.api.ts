import axios from 'axios';
import { env } from '@/config/env';

export interface ReportarErrorRequest {
  referenceId: string;
  message: string;
  source: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
}

export interface ReportarErrorResponse {
  key: string;
  url: string;
}

const SOURCE_TRACAUTO = 'tracauto';
const REPORT_ERROR_URL = `${env.apiBaseUrl.replace(/\/+$/, '')}/public/v1/support/report-error`;

/**
 * Reporta un error al backend para crear un Bug en Jira.
 * Usa URL pública sin enviar token de autenticación.
 */
export async function reportarError(datos: Omit<ReportarErrorRequest, 'source'>): Promise<ReportarErrorResponse> {
  const response = await axios.post<ReportarErrorResponse>(REPORT_ERROR_URL, {
    ...datos,
    source: SOURCE_TRACAUTO,
  }, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    timeout: 30_000,
  });
  return response.data;
}
