import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Cpu, History, Upload, UserCircle } from 'lucide-react';
import { Button, Card, ImportExcelModal, ImportProcessingModal, ImportResultsModal } from '@/shared/ui';
import { useErrorHandler, useImportJobPolling } from '@/hooks';
import { reportesApi } from '@/services/endpoints';
import type { ImportarExcelResponse } from '@/services/endpoints/reportes.api';
import { downloadBlob } from '@/shared/utils/fileUtils';
import { toast } from '@/store/toast.store';
import { ImportHistoryTable } from '../components/ImportHistoryTable';
import { TipoImportacion } from '../types';

export function ImportsPage() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportResultsModalOpen, setIsImportResultsModalOpen] = useState(false);
  const [isImportProcessingModalOpen, setIsImportProcessingModalOpen] = useState(false);
  const [importJobId, setImportJobId] = useState<string | undefined>(undefined);
  const [importResults, setImportResults] = useState<ImportarExcelResponse | null>(null);
  const [currentImportType, setCurrentImportType] = useState<TipoImportacion | null>(null);
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import');

  const { job: polledJob } = useImportJobPolling(
    isImportProcessingModalOpen ? importJobId : undefined,
  );

  const getImportTypeLabel = (type: TipoImportacion): string => {
    switch (type) {
      case TipoImportacion.Vehiculos:
        return t('imports.importVehicles');
      case TipoImportacion.Conductores:
        return t('imports.importDrivers');
      case TipoImportacion.Dispositivos:
        return t('imports.importDevices');
      default:
        return t('imports.title');
    }
  };

  const handleOpenImportModal = (type: TipoImportacion) => {
    setCurrentImportType(type);
    setIsImportModalOpen(true);
  };

  useEffect(() => {
    if (!polledJob || !isImportProcessingModalOpen || !currentImportType) return;

    const isCompleted = polledJob.estado === 2;
    const isFailed = polledJob.estado === 3;

    if (!isCompleted && !isFailed) return;

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
      toast.error(polledJob.mensajeError ?? t('imports.processing.failed'));
      return;
    }

    if ((polledJob.filasConErrores ?? 0) === 0) {
      toast.success(t('imports.results.allSuccess'));
      return;
    }

    toast.success(
      t('imports.results.importedCount', {
        count: polledJob.filasExitosas ?? 0,
      }),
    );
  }, [currentImportType, isImportProcessingModalOpen, polledJob, t]);

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
          throw new Error(t('imports.invalidType'));
      }

      if (results.jobId) {
        setImportJobId(results.jobId);
        setIsImportProcessingModalOpen(true);
        setIsImportModalOpen(false);
        setActiveTab('history');
        return;
      }

      setImportResults(results);
      setIsImportResultsModalOpen(true);
      setIsImportModalOpen(false);
      setActiveTab('history');

      if (results.filasConErrores === 0) {
        toast.success(t('imports.results.allSuccess'));
      } else {
        toast.success(
          t('imports.results.importedCount', {
            count: results.filasExitosas,
          }),
        );
      }
    } catch (error) {
      handleApiError(error);
      throw error;
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
          templateLabel: t('imports.downloadVehicleTemplate'),
        };
      case TipoImportacion.Conductores:
        return {
          onDownloadTemplate: async () => {
            const blob = await reportesApi.downloadTemplateConductoresExcel();
            downloadBlob(blob, 'template_conductores.xlsx');
          },
          templateLabel: t('imports.downloadDriverTemplate'),
        };
      case TipoImportacion.Dispositivos:
        return {
          onDownloadTemplate: async () => {
            const blob = await reportesApi.downloadTemplateDispositivosExcel();
            downloadBlob(blob, 'template_dispositivos.xlsx');
          },
          templateLabel: t('imports.downloadDeviceTemplate'),
        };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('imports.title')}</h1>
        <p className="mt-1 text-text-muted">{t('imports.subtitle')}</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'import'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Upload size={16} className="mr-2 inline" />
          {t('imports.tab.import')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <History size={16} className="mr-2 inline" />
          {t('imports.tab.history')}
        </button>
      </div>

      {activeTab === 'import' && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card>
              <div className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-lg bg-primary/10 p-3">
                    <Car size={24} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-text">{t('imports.importVehicles')}</h3>
                    <p className="line-clamp-2 text-sm text-text-muted">{t('imports.importVehiclesDesc')}</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleOpenImportModal(TipoImportacion.Vehiculos)}
                >
                  <Upload size={16} className="mr-2" />
                  {t('imports.import')}
                </Button>
              </div>
            </Card>

            <Card>
              <div className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-lg bg-primary/10 p-3">
                    <UserCircle size={24} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-text">{t('imports.importDrivers')}</h3>
                    <p className="line-clamp-2 text-sm text-text-muted">{t('imports.importDriversDesc')}</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleOpenImportModal(TipoImportacion.Conductores)}
                >
                  <Upload size={16} className="mr-2" />
                  {t('imports.import')}
                </Button>
              </div>
            </Card>

            <Card>
              <div className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-lg bg-primary/10 p-3">
                    <Cpu size={24} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-text">{t('imports.importDevices')}</h3>
                    <p className="line-clamp-2 text-sm text-text-muted">{t('imports.importDevicesDesc')}</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleOpenImportModal(TipoImportacion.Dispositivos)}
                >
                  <Upload size={16} className="mr-2" />
                  {t('imports.import')}
                </Button>
              </div>
            </Card>
          </div>

          <ImportProcessingModal
            isOpen={isImportProcessingModalOpen}
            tipoImportacion={currentImportType ? getImportTypeLabel(currentImportType) : undefined}
          />

          <ImportExcelModal
            isOpen={isImportModalOpen}
            onClose={() => {
              setIsImportModalOpen(false);
              setCurrentImportType(null);
            }}
            onImport={handleImport}
            title={currentImportType ? getImportTypeLabel(currentImportType) : t('imports.selectFile')}
            {...(currentImportType ? getDownloadTemplateConfig(currentImportType) : {})}
          />
        </>
      )}

      {activeTab === 'history' && <ImportHistoryTable />}

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
