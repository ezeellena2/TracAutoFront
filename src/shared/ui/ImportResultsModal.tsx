import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import type {
  ErrorFilaImportacion,
  ImportarExcelResponse,
  ResultadoFilaImportacion,
} from '@/services/endpoints/reportes.api';
import { useErrorHandler } from '@/hooks';
import { reportesApi } from '@/services/endpoints';
import { downloadBlob } from '@/shared/utils/fileUtils';
import { toast } from '@/store/toast.store';
import { Badge } from './Badge';
import { Button } from './Button';
import { Modal } from './Modal';
import { Table } from './Table';

const PHONE_COLUMNS = new Set(['Telefono', 'Numero Telefono', 'Teléfono', 'Número Teléfono']);

function formatPhoneInternational(raw: string): string {
  try {
    const parsed = parsePhoneNumberFromString(raw);
    if (parsed && parsed.isValid()) return parsed.format('INTERNATIONAL');
  } catch {
    // Ignore parse errors and return original value.
  }

  return raw;
}

interface ImportResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: ImportarExcelResponse & { resultadosDetalle?: ResultadoFilaImportacion[] | null };
  tipoImportacion?: string;
  isLoading?: boolean;
}

export function ImportResultsModal({
  isOpen,
  onClose,
  results,
  tipoImportacion,
  isLoading = false,
}: ImportResultsModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const titleBase = t('imports.results.title');
  const title = tipoImportacion ? `${titleBase} - ${tipoImportacion}` : titleBase;
  const { totalFilas, filasExitosas, filasConErrores, errores, resultadosDetalle } = results;
  const hasErrors = errores.length > 0;
  const hasDetalle = Boolean(resultadosDetalle && resultadosDetalle.length > 0);

  const handleDownloadExcel = async () => {
    if (!results.jobId) return;

    setIsDownloadingExcel(true);
    try {
      const blob = await reportesApi.descargarImportacionJobExcel(String(results.jobId));
      const fecha = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `datos_importados_${fecha}.xlsx`);
      toast.success(t('imports.downloadExcelSuccess'));
    } catch (requestError: unknown) {
      const parsed = handleApiError(requestError, { showToast: false });
      const apiMessage =
        requestError && typeof requestError === 'object' && 'response' in requestError
          ? (requestError as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      toast.error(apiMessage ?? parsed.message ?? t('imports.downloadExcelError'));
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handleDownloadErrors = () => {
    const errorsJson = JSON.stringify(errores, null, 2);
    const blob = new Blob([errorsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `errores-importacion-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const errorColumns = [
    { key: 'numeroFila', header: t('imports.results.row') },
    { key: 'tipoEntidad', header: t('imports.results.entity') },
    { key: 'identificador', header: t('imports.results.identifier') },
    {
      key: 'mensaje',
      header: t('imports.results.message'),
      render: (error: ErrorFilaImportacion) => (
        <div className="max-w-md">
          <p className="text-sm text-text">{error.mensaje}</p>
          {error.campo && (
            <p className="mt-1 text-xs text-text-muted">
              {t('imports.results.field')}: {error.campo}
            </p>
          )}
        </div>
      ),
    },
  ];

  const orderByType: Record<string, string[]> = {
    vehiculos: ['Patente', 'Marca', 'Modelo', 'Año', 'Ano', 'Tipo', 'Activo'],
    conductores: ['Nombre Completo', 'DNI', 'Email', 'Telefono', 'Teléfono', 'Activo'],
    dispositivos: ['Device ID', 'Alias', 'Numero Telefono', 'Número Teléfono', 'Activo'],
  };

  const inferType = (): string => {
    if (!hasDetalle || !resultadosDetalle?.length) return 'vehiculos';
    const keys = Object.keys(resultadosDetalle[0]?.datosFila ?? {});
    if (keys.some((key) => key === 'Device ID' || key === 'TraccarDeviceId')) return 'dispositivos';
    if (keys.some((key) => key === 'Nombre Completo' || key === 'DNI')) return 'conductores';
    return 'vehiculos';
  };

  const preferredColumns = orderByType[inferType()] ?? orderByType.vehiculos;
  const availableDataColumns = hasDetalle
    ? Array.from(
        new Set(
          resultadosDetalle!.flatMap((row) => (row.datosFila ? Object.keys(row.datosFila) : [])),
        ),
      )
    : [];
  const orderedDataColumns = [
    ...preferredColumns.filter((column) => availableDataColumns.includes(column)),
    ...availableDataColumns.filter((column) => !preferredColumns.includes(column)).sort(),
  ];

  const detailColumns = [
    { key: 'numeroFila', header: t('imports.results.row') },
    {
      key: 'accion',
      header: t('imports.results.action'),
      render: (row: ResultadoFilaImportacion) => {
        if (row.accion === 'Creado') {
          return (
            <Badge variant="success">
              <Plus size={12} className="mr-1" />
              {t('imports.results.created')}
            </Badge>
          );
        }

        if (row.accion === 'Actualizado') {
          return (
            <Badge variant="info">
              <RefreshCw size={12} className="mr-1" />
              {t('imports.results.updated')}
            </Badge>
          );
        }

        return (
          <span title={row.mensaje}>
            <Badge variant="error">
              <XCircle size={12} className="mr-1" />
              {t('imports.results.error')}
            </Badge>
          </span>
        );
      },
    },
    {
      key: 'mensaje',
      header: t('imports.results.message'),
      render: (row: ResultadoFilaImportacion) => (
        row.mensaje ? <span className="text-sm text-error">{row.mensaje}</span> : '-'
      ),
    },
    ...orderedDataColumns.map((column) => ({
      key: `datosFila.${column}`,
      header: column,
      render: (row: ResultadoFilaImportacion) => {
        const value = row.datosFila?.[column];
        if (value == null) return '-';
        const text = String(value);
        return PHONE_COLUMNS.has(column) ? formatPhoneInternational(text) : text;
      },
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="4xl">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-primary" />
            <p className="mt-4 text-sm text-text-muted">{t('imports.loadingDetails')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-text-muted/10 p-2">
                    <AlertCircle size={20} className="text-text-muted" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text">{totalFilas}</p>
                    <p className="text-sm text-text-muted">{t('imports.results.totalRows')}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-success/20 bg-success/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-success/20 p-2">
                    <CheckCircle2 size={20} className="text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">{filasExitosas}</p>
                    <p className="text-sm text-text-muted">{t('imports.results.successfulRows')}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-error/20 bg-error/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-error/20 p-2">
                    <XCircle size={20} className="text-error" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-error">{filasConErrores}</p>
                    <p className="text-sm text-text-muted">{t('imports.results.errorRows')}</p>
                  </div>
                </div>
              </div>
            </div>

            {hasDetalle && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-text">
                  {t('imports.results.detailByRow')} ({resultadosDetalle!.length})
                </h3>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                  <Table
                    data={resultadosDetalle!}
                    columns={detailColumns}
                    keyExtractor={(row) => `${row.numeroFila}-${row.identificador}-${row.accion}`}
                    emptyMessage="-"
                  />
                </div>
              </div>
            )}

            {hasErrors && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text">
                    {t('imports.results.errors')} ({errores.length})
                  </h3>
                  <Button variant="ghost" size="sm" onClick={handleDownloadErrors}>
                    <Download size={16} className="mr-2" />
                    {t('imports.downloadErrors')}
                  </Button>
                </div>
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table
                    data={errores}
                    columns={errorColumns}
                    keyExtractor={(error) => `${error.numeroFila}-${error.tipoEntidad}-${error.identificador}`}
                    emptyMessage={t('imports.results.noErrors')}
                  />
                </div>
              </div>
            )}

            {!hasErrors && (
              <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/10 p-4">
                <CheckCircle2 size={24} className="text-success" />
                <div>
                  <p className="font-medium text-success">{t('imports.results.allSuccess')}</p>
                  <p className="mt-1 text-sm text-text-muted">
                    {t('imports.results.importedCount', { count: filasExitosas })}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between border-t border-border pt-4">
              <div>
                {results.jobId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadExcel}
                    disabled={isDownloadingExcel}
                  >
                    {isDownloadingExcel ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet size={16} className="mr-2" />
                    )}
                    {t('imports.downloadExcel')}
                  </Button>
                )}
              </div>
              <Button variant="primary" onClick={onClose}>
                {t('common.close')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
