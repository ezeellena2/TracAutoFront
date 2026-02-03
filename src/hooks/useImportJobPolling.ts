import { useCallback, useEffect, useRef, useState } from 'react';
import { reportesApi } from '@/services/endpoints';
import { EstadoImportacionJob, type ImportacionJobDto } from '@/services/endpoints/reportes.api';

const POLL_INTERVAL_MS = 2000;

/**
 * Polls the import job status until it reaches a terminal state (Completado or Fallido).
 * Returns the final job data when complete.
 */
export function useImportJobPolling(jobId: string | undefined) {
  const [job, setJob] = useState<ImportacionJobDto | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const result = await reportesApi.obtenerImportacionJob(jobId);
        setJob(result);

        if (
          result.estado === EstadoImportacionJob.Completado ||
          result.estado === EstadoImportacionJob.Fallido
        ) {
          stopPolling();
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Error al consultar estado de importación';
        setError(message);
        stopPolling();
      }
    };

    setIsPolling(true);
    setError(null);
    setJob(null);

    // First poll immediately
    void poll();

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jobId, stopPolling]);

  return { job, isPolling, error, stopPolling };
}
