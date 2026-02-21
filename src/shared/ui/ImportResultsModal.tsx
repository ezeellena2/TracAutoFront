import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, AlertCircle, Download, Plus, RefreshCw, Loader2, FileSpreadsheet } from 'lucide-react';

import { Modal } from './Modal';
import { Button } from './Button';
import { Table } from './Table';
import { Badge } from './Badge';
import { reportesApi } from '@/services/endpoints';
import { downloadBlob } from '@/shared/utils/fileUtils';
import { toast } from '@/store/toast.store';
import type { ImportarExcelResponse, ResultadoFilaImportacion } from '@/services/endpoints/reportes.api';

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
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const titleBase = t('imports.results.title', { defaultValue: 'Resultados de Importación' });
  const title = tipoImportacion ? `${titleBase} - ${tipoImportacion}` : titleBase;
  const { totalFilas, filasExitosas, filasConErrores, errores, resultadosDetalle } = results;
  const hasErrors = errores.length > 0;
  const hasDetalle = resultadosDetalle && resultadosDetalle.length > 0;

  const jobId = results.jobId;
  const handleDownloadExcel = async () => {
    if (!jobId) return;
    setIsDownloadingExcel(true);
    try {
      const blob = await reportesApi.descargarImportacionJobExcel(String(jobId));
      const fecha = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `datos_importados_${fecha}.xlsx`);
      toast.success(t('imports.downloadExcelSuccess', { defaultValue: 'Excel descargado correctamente' }));
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
        : null;
      toast.error(msg ?? t('imports.downloadExcelError', { defaultValue: 'Error al descargar el Excel' }));
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
    {
      key: 'numeroFila',
      header: t('imports.results.row', { defaultValue: 'Fila' }),
    },
    {
      key: 'tipoEntidad',
      header: t('imports.results.entity', { defaultValue: 'Entidad' }),
    },
    {
      key: 'identificador',
      header: t('imports.results.identifier', { defaultValue: 'Identificador' }),
    },
    {
      key: 'mensaje',
      header: t('imports.results.message', { defaultValue: 'Mensaje' }),
      render: (error: any) => (
        <div className="max-w-md">
          <p className="text-sm text-text">{error.mensaje}</p>
          {error.campo && (
            <p className="text-xs text-text-muted mt-1">
              {t('imports.results.field', { defaultValue: 'Campo' })}: {error.campo}
            </p>
          )}
        </div>
      ),
    },
  ];

  // Orden según tipo: primero datos de importación, luego datos en orden de importación
  const ordenColumnasPorTipo: Record<string, string[]> = {
    vehiculos: ['Patente', 'Marca', 'Modelo', 'Año', 'Tipo', 'Activo'],
    conductores: ['Nombre Completo', 'DNI', 'Email', 'Teléfono', 'Activo'],
    dispositivos: ['Device ID', 'Alias', 'Número Teléfono', 'Activo'],
  };
  const inferirTipo = (): string => {
    if (!hasDetalle || !resultadosDetalle!.length) return 'vehiculos';
    const keys = Object.keys(resultadosDetalle![0]?.datosFila ?? {});
    if (keys.some((k) => k === 'Device ID' || k === 'TraccarDeviceId')) return 'dispositivos';
    if (keys.some((k) => k === 'Nombre Completo' || k === 'DNI')) return 'conductores';
    return 'vehiculos';
  };
  const ordenColumnasDatos = ordenColumnasPorTipo[inferirTipo()] ?? ordenColumnasPorTipo.vehiculos;
  const columnasDatosDisponibles = hasDetalle
    ? Array.from(
      new Set(
        resultadosDetalle!.flatMap((r) =>
          r.datosFila ? Object.keys(r.datosFila) : []
        )
      )
    )
    : [];
  const columnasDatosOrdenadas = [
    ...ordenColumnasDatos.filter((c) => columnasDatosDisponibles.includes(c)),
    ...columnasDatosDisponibles.filter((c) => !ordenColumnasDatos.includes(c)).sort(),
  ];

  const detalleColumns = [
    {
      key: 'numeroFila',
      header: t('imports.results.row', { defaultValue: 'Fila' }),
    },
    {
      key: 'accion',
      header: t('imports.results.action', { defaultValue: 'Acción' }),
      render: (r: ResultadoFilaImportacion) => {
        const accion = r.accion as string;
        if (accion === 'Creado') {
          return (
            <Badge variant="success">
              <Plus size={12} className="mr-1" />
              {t('imports.results.created', { defaultValue: 'Creado' })}
            </Badge>
          );
        }
        if (accion === 'Actualizado') {
          return (
            <Badge variant="info">
              <RefreshCw size={12} className="mr-1" />
              {t('imports.results.updated', { defaultValue: 'Actualizado' })}
            </Badge>
          );
        }
        return (
          <span title={r.mensaje}>
            <Badge variant="error">
              <XCircle size={12} className="mr-1" />
              {t('imports.results.error', { defaultValue: 'Error' })}
            </Badge>
          </span>
        );
      },
    },
    {
      key: 'mensaje',
      header: t('imports.results.message', { defaultValue: 'Mensaje' }),
      render: (r: ResultadoFilaImportacion) => (r.mensaje ? <span className="text-sm text-error">{r.mensaje}</span> : '-'),
    },
    ...columnasDatosOrdenadas.map((col) => ({
      key: `datosFila.${col}`,
      header: col,
      render: (r: ResultadoFilaImportacion) => {
        const val = r.datosFila?.[col];
        if (val == null) return '-';
        return String(val);
      },
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="4xl"
    >
      <div className="space-y-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-primary" />
            <p className="mt-4 text-sm text-text-muted">
              {t('imports.loadingDetails', { defaultValue: 'Cargando detalles...' })}
            </p>
          </div>
        )}
        {!isLoading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-text-muted/10">
                    <AlertCircle size={20} className="text-text-muted" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text">{totalFilas}</p>
                    <p className="text-sm text-text-muted">
                      {t('imports.results.totalRows', { defaultValue: 'Total de filas' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/20">
                    <CheckCircle2 size={20} className="text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">{filasExitosas}</p>
                    <p className="text-sm text-text-muted">
                      {t('imports.results.successfulRows', { defaultValue: 'Filas exitosas' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-error/10 border border-error/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-error/20">
                    <XCircle size={20} className="text-error" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-error">{filasConErrores}</p>
                    <p className="text-sm text-text-muted">
                      {t('imports.results.errorRows', { defaultValue: 'Filas con errores' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalle por registro */}
            {hasDetalle && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-text">
                  {t('imports.results.detailByRow', { defaultValue: 'Detalle por registro' })} ({resultadosDetalle!.length})
                </h3>
                <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <Table
                    data={resultadosDetalle!}
                    columns={detalleColumns}
                    keyExtractor={(r) => `${r.numeroFila}-${r.identificador}-${r.accion}`}
                    emptyMessage="-"
                  />
                </div>
              </div>
            )}

            {/* Errors Table */}
            {hasErrors && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text">
                    {t('imports.results.errors', { defaultValue: 'Errores' })} ({errores.length})
                  </h3>
                  <Button variant="ghost" size="sm" onClick={handleDownloadErrors}>
                    <Download size={16} className="mr-2" />
                    {t('imports.downloadErrors', { defaultValue: 'Descargar errores' })}
                  </Button>
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table
                    data={errores}
                    columns={errorColumns}
                    keyExtractor={(error) => `${error.numeroFila}-${error.tipoEntidad}-${error.identificador}`}
                    emptyMessage={t('imports.results.noErrors', { defaultValue: 'No hay errores' })}
                  />
                </div>
              </div>
            )}

            {/* Success Message */}
            {!hasErrors && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle2 size={24} className="text-success" />
                <div>
                  <p className="font-medium text-success">
                    {t('imports.results.allSuccess', {
                      defaultValue: 'Todas las filas se importaron exitosamente',
                    })}
                  </p>
                  <p className="text-sm text-text-muted mt-1">
                    {t('imports.results.importedCount', {
                      defaultValue: 'Se importaron {count} filas',
                      count: filasExitosas,
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-border">
              <div>
                {jobId && (
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
                    {t('imports.downloadExcel', { defaultValue: 'Descargar Excel' })}
                  </Button>
                )}
              </div>
              <Button variant="primary" onClick={onClose}>
                {t('common.close', { defaultValue: 'Cerrar' })}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
