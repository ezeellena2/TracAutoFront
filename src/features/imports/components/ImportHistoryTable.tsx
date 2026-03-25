import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Clock, Eye, XCircle } from 'lucide-react';
import { Badge, Button, Card, PaginationControls, Table } from '@/shared/ui';
import { useErrorHandler, useLocalization, usePaginationParams } from '@/hooks';
import { reportesApi } from '@/services/endpoints';
import { EstadoImportacionJob, type ImportacionJobDto } from '@/services/endpoints/reportes.api';
import type { ListaPaginada } from '@/shared/types/api';
import { formatDateTime } from '@/shared/utils';
import { ImportResultsModal } from '@/shared/ui';

interface ImportHistoryTableProps {
  tipoImportacion?: string;
}

export function ImportHistoryTable({ tipoImportacion }: ImportHistoryTableProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const { culture, timeZoneId } = useLocalization();
  const [historyData, setHistoryData] = useState<ListaPaginada<ImportacionJobDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ImportacionJobDto | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const { setNumeroPagina, setTamanoPagina, params: paginationParams } = usePaginationParams({
    initialPageSize: 10,
  });

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await reportesApi.listarImportacionJobs({
        numeroPagina: paginationParams.numeroPagina,
        tamanoPagina: paginationParams.tamanoPagina,
        tipoImportacion: tipoImportacion || undefined,
      });
      setHistoryData(result);
    } catch (requestError) {
      const parsed = handleApiError(requestError, { showToast: false });
      setError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, paginationParams, tipoImportacion]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const getEstadoBadge = (estado: EstadoImportacionJob) => {
    switch (estado) {
      case EstadoImportacionJob.Pendiente:
        return (
          <Badge variant="info">
            <Clock size={14} className="mr-1" />
            {t('imports.history.status.pending')}
          </Badge>
        );
      case EstadoImportacionJob.Procesando:
        return (
          <Badge variant="warning">
            <Clock size={14} className="mr-1 animate-spin" />
            {t('imports.history.status.processing')}
          </Badge>
        );
      case EstadoImportacionJob.Completado:
        return (
          <Badge variant="success">
            <CheckCircle size={14} className="mr-1" />
            {t('imports.history.status.completed')}
          </Badge>
        );
      case EstadoImportacionJob.Fallido:
        return (
          <Badge variant="error">
            <XCircle size={14} className="mr-1" />
            {t('imports.history.status.failed')}
          </Badge>
        );
      default:
        return <Badge variant="info">{estado}</Badge>;
    }
  };

  const getTipoImportacionLabel = (tipo: string): string => {
    switch (tipo.toLowerCase()) {
      case 'vehiculos':
        return t('imports.importVehicles');
      case 'conductores':
        return t('imports.importDrivers');
      case 'dispositivos':
        return t('imports.importDevices');
      default:
        return tipo;
    }
  };

  const handleViewDetails = useCallback(async (job: ImportacionJobDto) => {
    setIsDetailsModalOpen(true);
    setIsLoadingDetails(true);
    setSelectedJob(null);

    try {
      const fullJob = await reportesApi.obtenerImportacionJob(job.id);
      setSelectedJob(fullJob);
    } catch (requestError) {
      handleApiError(requestError);
      setIsDetailsModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [handleApiError]);

  const columns = [
    {
      key: 'fechaCreacion',
      header: t('imports.history.date'),
      render: (job: ImportacionJobDto) => formatDateTime(job.fechaCreacion, culture, timeZoneId),
    },
    {
      key: 'tipoImportacion',
      header: t('imports.history.type'),
      render: (job: ImportacionJobDto) => getTipoImportacionLabel(job.tipoImportacion),
    },
    {
      key: 'nombreArchivo',
      header: t('imports.history.fileName'),
      render: (job: ImportacionJobDto) => <span className="font-mono text-sm">{job.nombreArchivo}</span>,
    },
    {
      key: 'totalFilas',
      header: t('imports.history.totalRows'),
      render: (job: ImportacionJobDto) => job.totalFilas ?? '-',
    },
    {
      key: 'filasExitosas',
      header: t('imports.history.successful'),
      render: (job: ImportacionJobDto) => <span className="text-success">{job.filasExitosas ?? '-'}</span>,
    },
    {
      key: 'filasConErrores',
      header: t('imports.history.errors'),
      render: (job: ImportacionJobDto) => (
        <span className={job.filasConErrores && job.filasConErrores > 0 ? 'text-error' : ''}>
          {job.filasConErrores ?? '-'}
        </span>
      ),
    },
    {
      key: 'estado',
      header: t('imports.history.statusLabel'),
      render: (job: ImportacionJobDto) => getEstadoBadge(job.estado),
    },
    {
      key: 'actions',
      header: t('imports.history.actions'),
      render: (job: ImportacionJobDto) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(job)}
          title={t('imports.history.viewDetails')}
        >
          <Eye size={16} />
        </Button>
      ),
    },
  ];

  if (isLoading && !historyData) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-4 text-text-muted">{t('imports.history.loading')}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error && !historyData) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle size={48} className="mb-4 text-error" />
          <h3 className="mb-2 text-lg font-semibold text-text">{t('imports.history.loadError')}</h3>
          <p className="mb-6 max-w-md text-center text-text-muted">{error}</p>
          <Button onClick={loadHistory}>{t('common.retry')}</Button>
        </div>
      </Card>
    );
  }

  const jobs = historyData?.items ?? [];

  if (jobs.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle size={48} className="mb-4 text-text-muted" />
          <h3 className="mb-2 text-lg font-semibold text-text">{t('imports.history.empty')}</h3>
          <p className="max-w-md text-center text-text-muted">{t('imports.history.emptyDescription')}</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card padding="none">
        <Table columns={columns} data={jobs} keyExtractor={(job) => job.id} enableFilters={false} />
        {historyData && historyData.totalRegistros > 0 && (
          <PaginationControls
            paginaActual={historyData.paginaActual}
            totalPaginas={historyData.totalPaginas}
            tamanoPagina={historyData.tamanoPagina}
            totalRegistros={historyData.totalRegistros}
            onPageChange={setNumeroPagina}
            onPageSizeChange={setTamanoPagina}
            disabled={isLoading}
          />
        )}
      </Card>

      <ImportResultsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedJob(null);
        }}
        results={
          selectedJob
            ? {
                jobId: selectedJob.id,
                totalFilas: selectedJob.totalFilas ?? 0,
                filasExitosas: selectedJob.filasExitosas ?? 0,
                filasConErrores: selectedJob.filasConErrores ?? 0,
                errores: selectedJob.errores ?? [],
                resultadosDetalle: selectedJob.resultadosDetalle ?? undefined,
              }
            : { totalFilas: 0, filasExitosas: 0, filasConErrores: 0, errores: [] }
        }
        tipoImportacion={selectedJob ? getTipoImportacionLabel(selectedJob.tipoImportacion) : undefined}
        isLoading={isLoadingDetails}
      />
    </>
  );
}
