import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Car, UserCircle, Cpu, History } from 'lucide-react';
import { Card, Button, ImportExcelModal, ImportResultsModal, ImportProcessingModal } from '@/shared/ui';
import { reportesApi } from '@/services/endpoints';
import type { ImportarExcelResponse } from '@/services/endpoints/reportes.api';
import { toast } from '@/store/toast.store';
import { downloadBlob } from '@/shared/utils/fileUtils';
import { useErrorHandler, useImportJobPolling } from '@/hooks';
import { TipoImportacion } from '../types';
import { ImportHistoryTable } from '../components/ImportHistoryTable';

export function ImportsPage() {
  const { t } = useTranslation();
  const { getErrorMessage } = useErrorHandler();

  // Import modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportResultsModalOpen, setIsImportResultsModalOpen] = useState(false);
  const [isImportProcessingModalOpen, setIsImportProcessingModalOpen] = useState(false);
  const [importJobId, setImportJobId] = useState<string | undefined>(undefined);
  const [importResults, setImportResults] = useState<ImportarExcelResponse | null>(null);
  const [currentImportType, setCurrentImportType] = useState<TipoImportacion | null>(null);
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');

  const { job: polledJob } = useImportJobPolling(
    isImportProcessingModalOpen ? importJobId : undefined
  );

  const handleOpenImportModal = (type: TipoImportacion) => {
    setCurrentImportType(type);
    setIsImportModalOpen(true);
  };

  // When polled job completes, show results modal and toast
  useEffect(() => {
    if (!polledJob || !isImportProcessingModalOpen || !currentImportType) return;
    const isCompleted = polledJob.estado === 2;
    const isFailed = polledJob.estado === 3;
    if (isCompleted || isFailed) {
      setIsImportProcessingModalOpen(false);
      setImportJobId(undefined);
      setImportResults({
        jobId: polledJob.id,
        totalFilas: polledJob.totalFilas ?? 0,
        filasExitosas: polledJob.filasExitosas ?? 0,
        filasConErrores: polledJob.filasConErrores ?? 0,
        errores: polledJob.errores ?? [],
        resultadosDetalle: polledJob.resultadosDetalle ?? undefined,
      });
      setIsImportResultsModalOpen(true);
      setActiveTab('history');
      if (isFailed) {
        toast.error(polledJob.mensajeError ?? t('imports.processing.failed', { defaultValue: 'La importación falló' }));
      } else if ((polledJob.filasConErrores ?? 0) === 0) {
        toast.success(t('imports.results.allSuccess', { defaultValue: 'Todas las filas se importaron exitosamente' }));
      } else {
        toast.success(
          t('imports.results.importedCount', {
            defaultValue: 'Se importaron {{count}} filas',
            count: polledJob.filasExitosas ?? 0,
          })
        );
      }
    }
  }, [polledJob, isImportProcessingModalOpen, currentImportType, t]);

  const handleImport = async (file: File) => {
    if (!currentImportType) return;

    try {
      let results: ImportarExcelResponse;

      switch (currentImportType) {
        case TipoImportacion.Vehiculos:
          results = await reportesApi.importVehiculosExcel(file);
          break;
        case TipoImportacion.Conductores:
          results = await reportesApi.importConductoresExcel(file);
          break;
        case TipoImportacion.Dispositivos:
          results = await reportesApi.importDispositivosExcel(file);
          break;
        default:
          throw new Error('Tipo de importación no válido');
      }

      if (results.jobId) {
        setImportJobId(results.jobId);
        setIsImportProcessingModalOpen(true);
        setIsImportModalOpen(false);
        setActiveTab('history');
      } else {
        setImportResults(results);
        setIsImportResultsModalOpen(true);
        setIsImportModalOpen(false);
        setActiveTab('history');
        if (results.filasConErrores === 0) {
          toast.success(t('imports.results.allSuccess', { defaultValue: 'Todas las filas se importaron exitosamente' }));
        } else {
          toast.success(
            t('imports.results.importedCount', {
              defaultValue: 'Se importaron {{count}} filas',
              count: results.filasExitosas,
            })
          );
        }
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  };

  const getImportTypeLabel = (type: TipoImportacion): string => {
    switch (type) {
      case TipoImportacion.Vehiculos:
        return t('imports.importVehicles', { defaultValue: 'Importar Vehículos' });
      case TipoImportacion.Conductores:
        return t('imports.importDrivers', { defaultValue: 'Importar Conductores' });
      case TipoImportacion.Dispositivos:
        return t('imports.importDevices', { defaultValue: 'Importar Dispositivos' });
    }
  };

  const getDownloadTemplateConfig = (type: TipoImportacion) => {
    switch (type) {
      case TipoImportacion.Vehiculos:
        return {
          onDownloadTemplate: async () => {
            const blob = await reportesApi.downloadTemplateVehiculosExcel();
            downloadBlob(blob, 'template_vehiculos.xlsx');
          },
          templateLabel: t('imports.downloadVehicleTemplate', { defaultValue: 'Template de Vehículos' }),
        };
      case TipoImportacion.Conductores:
        return {
          onDownloadTemplate: async () => {
            const blob = await reportesApi.downloadTemplateConductoresExcel();
            downloadBlob(blob, 'template_conductores.xlsx');
          },
          templateLabel: t('imports.downloadDriverTemplate', { defaultValue: 'Template de Conductores' }),
        };
      case TipoImportacion.Dispositivos:
        return {
          onDownloadTemplate: async () => {
            const blob = await reportesApi.downloadTemplateDispositivosExcel();
            downloadBlob(blob, 'template_dispositivos.xlsx');
          },
          templateLabel: t('imports.downloadDeviceTemplate', { defaultValue: 'Template de Dispositivos' }),
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('imports.title', { defaultValue: 'Importaciones' })}</h1>
        <p className="text-text-muted mt-1">
          {t('imports.subtitle', { defaultValue: 'Importa datos desde archivos Excel' })}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'import'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Upload size={16} className="inline mr-2" />
          {t('imports.tab.import', { defaultValue: 'Importar' })}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <History size={16} className="inline mr-2" />
          {t('imports.tab.history', { defaultValue: 'Historial' })}
        </button>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <>
          {/* Import Options - 2 cols en pantallas medianas (14"), 3 cols en xl para evitar wrap de títulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 p-3 rounded-lg bg-primary/10">
                <Car size={24} className="text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text">
                  {t('imports.importVehicles', { defaultValue: 'Importar Vehículos' })}
                </h3>
                <p className="text-sm text-text-muted line-clamp-2">
                  {t('imports.importVehiclesDesc', { defaultValue: 'Importa vehículos desde Excel' })}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => handleOpenImportModal(TipoImportacion.Vehiculos)}
            >
              <Upload size={16} className="mr-2" />
              {t('imports.import', { defaultValue: 'Importar' })}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 p-3 rounded-lg bg-primary/10">
                <UserCircle size={24} className="text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text">
                  {t('imports.importDrivers', { defaultValue: 'Importar Conductores' })}
                </h3>
                <p className="text-sm text-text-muted line-clamp-2">
                  {t('imports.importDriversDesc', { defaultValue: 'Importa conductores desde Excel' })}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => handleOpenImportModal(TipoImportacion.Conductores)}
            >
              <Upload size={16} className="mr-2" />
              {t('imports.import', { defaultValue: 'Importar' })}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 p-3 rounded-lg bg-primary/10">
                <Cpu size={24} className="text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text">
                  {t('imports.importDevices', { defaultValue: 'Importar Dispositivos' })}
                </h3>
                <p className="text-sm text-text-muted line-clamp-2">
                  {t('imports.importDevicesDesc', { defaultValue: 'Importa dispositivos desde Excel' })}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => handleOpenImportModal(TipoImportacion.Dispositivos)}
            >
              <Upload size={16} className="mr-2" />
              {t('imports.import', { defaultValue: 'Importar' })}
            </Button>
          </div>
        </Card>
      </div>

          {/* Import Processing Modal */}
      <ImportProcessingModal
        isOpen={isImportProcessingModalOpen}
        tipoImportacion={currentImportType ? getImportTypeLabel(currentImportType) : undefined}
      />

          {/* Import Modal */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setCurrentImportType(null);
        }}
        onImport={handleImport}
        title={currentImportType ? getImportTypeLabel(currentImportType) : t('imports.selectFile', { defaultValue: 'Seleccionar archivo Excel' })}
        {...(currentImportType ? getDownloadTemplateConfig(currentImportType) : {})}
      />

      {/* Import Results Modal */}
      {importResults && currentImportType && (
        <ImportResultsModal
          isOpen={isImportResultsModalOpen}
          onClose={() => {
            setIsImportResultsModalOpen(false);
            setImportResults(null);
            setCurrentImportType(null);
          }}
          results={importResults}
          tipoImportacion={getImportTypeLabel(currentImportType)}
        />
        )}
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && <ImportHistoryTable />}

      {/* Import Results Modal (shared) */}
      {importResults && currentImportType && (
        <ImportResultsModal
          isOpen={isImportResultsModalOpen}
          onClose={() => {
            setIsImportResultsModalOpen(false);
            setImportResults(null);
            setCurrentImportType(null);
          }}
          results={importResults}
          tipoImportacion={getImportTypeLabel(currentImportType)}
        />
      )}
    </div>
  );
}
