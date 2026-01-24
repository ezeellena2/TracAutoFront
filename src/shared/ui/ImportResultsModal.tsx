import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Table } from './Table';
import type { ImportarExcelResponse } from '@/services/endpoints/reportes.api';

interface ImportResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: ImportarExcelResponse;
  tipoImportacion?: string;
}

export function ImportResultsModal({
  isOpen,
  onClose,
  results,
  tipoImportacion,
}: ImportResultsModalProps) {
  const { t } = useTranslation();
  const { totalFilas, filasExitosas, filasConErrores, errores } = results;
  const hasErrors = errores.length > 0;

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

  const columns = [
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('imports.results.title', { defaultValue: 'Resultados de Importación' })}
      size="4xl"
    >
      <div className="space-y-6">
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
                columns={columns}
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
        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="primary" onClick={onClose}>
            {t('common.close', { defaultValue: 'Cerrar' })}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
