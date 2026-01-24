import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, Table, Badge, Button, PaginationControls } from '@/shared/ui';
import { reportesApi } from '@/services/endpoints';
import type { ImportacionJobDto, EstadoImportacionJob } from '@/services/endpoints/reportes.api';
import type { ListaPaginada } from '@/shared/types/api';
import { usePaginationParams, useErrorHandler, useLocalization } from '@/hooks';
import { toast } from '@/store/toast.store';
import { formatDateTime } from '@/shared/utils';
import { ImportResultsModal } from '@/shared/ui';

interface ImportHistoryTableProps {
  tipoImportacion?: string;
}

export function ImportHistoryTable({ tipoImportacion }: ImportHistoryTableProps) {
  const { t } = useTranslation();
  const { getErrorMessage } = useErrorHandler();
  const { culture, timeZoneId } = useLocalization();

  const [historyData, setHistoryData] = useState<ListaPaginada<ImportacionJobDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<ImportacionJobDto | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const {
    setNumeroPagina,
    setTamanoPagina,
    params: paginationParams,
  } = usePaginationParams({ initialPageSize: 10 });

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
    } catch (e) {
      setError(getErrorMessage(e));
      toast.error(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [paginationParams, tipoImportacion, getErrorMessage]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const getEstadoBadge = (estado: EstadoImportacionJob) => {
    switch (estado) {
      case EstadoImportacionJob.Pendiente:
        return (
          <Badge variant="info">
            <Clock size={14} className="mr-1" />
            {t('imports.history.status.pending', { defaultValue: 'Pendiente' })}
          </Badge>
        );
      case EstadoImportacionJob.Procesando:
        return (
          <Badge variant="warning">
            <Clock size={14} className="mr-1 animate-spin" />
            {t('imports.history.status.processing', { defaultValue: 'Procesando' })}
          </Badge>
        );
      case EstadoImportacionJob.Completado:
        return (
          <Badge variant="success">
            <CheckCircle size={14} className="mr-1" />
            {t('imports.history.status.completed', { defaultValue: 'Completado' })}
          </Badge>
        );
      case EstadoImportacionJob.Fallido:
        return (
          <Badge variant="error">
            <XCircle size={14} className="mr-1" />
            {t('imports.history.status.failed', { defaultValue: 'Fallido' })}
          </Badge>
        );
      default:
        return <Badge variant="info">{estado}</Badge>;
    }
  };

  const getTipoImportacionLabel = (tipo: string): string => {
    switch (tipo.toLowerCase()) {
      case 'vehiculos':
        return t('imports.importVehicles', { defaultValue: 'Vehículos' });
      case 'conductores':
        return t('imports.importDrivers', { defaultValue: 'Conductores' });
      case 'dispositivos':
        return t('imports.importDevices', { defaultValue: 'Dispositivos' });
      default:
        return tipo;
    }
  };

  const handleViewDetails = (job: ImportacionJobDto) => {
    setSelectedJob(job);
    setIsDetailsModalOpen(true);
  };

  const columns = [
    {
      key: 'fechaCreacion',
      header: t('imports.history.date', { defaultValue: 'Fecha' }),
      render: (job: ImportacionJobDto) => formatDateTime(job.fechaCreacion, culture, timeZoneId),
    },
    {
      key: 'tipoImportacion',
      header: t('imports.history.type', { defaultValue: 'Tipo' }),
      render: (job: ImportacionJobDto) => getTipoImportacionLabel(job.tipoImportacion),
    },
    {
      key: 'nombreArchivo',
      header: t('imports.history.fileName', { defaultValue: 'Archivo' }),
      render: (job: ImportacionJobDto) => (
        <span className="font-mono text-sm">{job.nombreArchivo}</span>
      ),
    },
    {
      key: 'totalFilas',
      header: t('imports.history.totalRows', { defaultValue: 'Total Filas' }),
      render: (job: ImportacionJobDto) => job.totalFilas ?? '-',
    },
    {
      key: 'filasExitosas',
      header: t('imports.history.successful', { defaultValue: 'Exitosas' }),
      render: (job: ImportacionJobDto) => (
        <span className="text-success">{job.filasExitosas ?? '-'}</span>
      ),
    },
    {
      key: 'filasConErrores',
      header: t('imports.history.errors', { defaultValue: 'Errores' }),
      render: (job: ImportacionJobDto) => (
        <span className={job.filasConErrores && job.filasConErrores > 0 ? 'text-error' : ''}>
          {job.filasConErrores ?? '-'}
        </span>
      ),
    },
    {
      key: 'estado',
      header: t('imports.history.status', { defaultValue: 'Estado' }),
      render: (job: ImportacionJobDto) => getEstadoBadge(job.estado),
    },
    {
      key: 'actions',
      header: t('imports.history.actions', { defaultValue: 'Acciones' }),
      render: (job: ImportacionJobDto) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewDetails(job)}
          title={t('imports.history.viewDetails', { defaultValue: 'Ver detalles' })}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-text-muted mt-4">{t('imports.history.loading', { defaultValue: 'Cargando historial...' })}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error && !historyData) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle size={48} className="text-error mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            {t('imports.history.loadError', { defaultValue: 'Error al cargar historial' })}
          </h3>
          <p className="text-text-muted mb-6 text-center max-w-md">{error}</p>
          <Button onClick={loadHistory}>{t('common.retry', { defaultValue: 'Reintentar' })}</Button>
        </div>
      </Card>
    );
  }

  const jobs = historyData?.items ?? [];

  if (jobs.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle size={48} className="text-text-muted mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            {t('imports.history.empty', { defaultValue: 'No hay importaciones' })}
          </h3>
          <p className="text-text-muted text-center max-w-md">
            {t('imports.history.emptyDescription', { defaultValue: 'Aún no se han realizado importaciones' })}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card padding="none">
        <Table
          columns={columns}
          data={jobs}
          keyExtractor={(job) => job.id}
          enableFilters={false}
        />
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

      {/* Details Modal */}
      {selectedJob && (
        <ImportResultsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedJob(null);
          }}
          results={{
            totalFilas: selectedJob.totalFilas ?? 0,
            filasExitosas: selectedJob.filasExitosas ?? 0,
            filasConErrores: selectedJob.filasConErrores ?? 0,
            errores: selectedJob.errores ?? [],
          }}
          tipoImportacion={getTipoImportacionLabel(selectedJob.tipoImportacion)}
        />
      )}
    </>
  );
}
