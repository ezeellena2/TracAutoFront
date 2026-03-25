import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, Settings, AlertCircle, Plus, Edit, Trash2, Share2, Upload, Download, QrCode, Package, History } from 'lucide-react';
import { Card, Table, Badge, Button, Modal, Input, PaginationControls, AdvancedFilterBar, FilterConfig, ImportExcelModal, ImportResultsModal, ImportProcessingModal } from '@/shared/ui';
import { ConfirmationModal } from '@/shared/ui/ConfirmationModal';
import { dispositivosApi, reportesApi } from '@/services/endpoints';
import type { ImportarExcelResponse } from '@/services/endpoints/reportes.api';
import { usePermissions, usePaginationParams, useLocalization, useErrorHandler, useTableFilters, useImportJobPolling } from '@/hooks';
import { useAuthStore } from '@/store';
import { toast } from '@/store/toast.store';
import type { DispositivoDto, ListaPaginada, TipoRecurso } from '@/shared/types/api';
import { NivelPermisoCompartido } from '@/shared/types/api';
import { formatDateTime } from '@/shared/utils';
import { downloadBlob } from '@/shared/utils/fileUtils';
import { GestionarComparticionModal } from '@/features/organization';
import { DeviceQrModal, stockBadgeVariants, stockStatusLabels } from '@/features/devices/components/DeviceQrModal';
import { DeviceStockChangeModal } from '@/features/devices/components/DeviceStockChangeModal';
import { DeviceStockHistoryModal } from '@/features/devices/components/DeviceStockHistoryModal';

const getDeviceFiltersConfig = (t: (key: string, options?: Record<string, unknown>) => string): FilterConfig[] => [
  { key: 'soloActivos', label: t('devices.onlyActive'), type: 'boolean' },
];

export function DevicesPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { culture, timeZoneId } = useLocalization();
  const { handleApiError } = useErrorHandler();
  // Datos paginados
  const [devicesData, setDevicesData] = useState<ListaPaginada<DispositivoDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hook de paginaciÃ³n reutilizable
  const {
    setNumeroPagina,
    setTamanoPagina,
    params: paginationParams
  } = usePaginationParams({ initialPageSize: 10 });

  // Filters hook
  const {
    filters,
    setFilter,
    clearFilters
  } = useTableFilters({ soloActivos: 'true' });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    traccarDeviceId: '',
    alias: '',
    numeroTelefono: '',
  });
  const [createErrors, setCreateErrors] = useState<{
    traccarDeviceId?: string;
  }>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DispositivoDto | null>(null);
  const [editForm, setEditForm] = useState({
    alias: '',
    activo: true,
    numeroTelefono: '',
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<DispositivoDto | null>(null);

  // Sharing modal
  const [deviceToShare, setDeviceToShare] = useState<DispositivoDto | null>(null);

  // Stock / QR modals
  const [deviceForQr, setDeviceForQr] = useState<DispositivoDto | null>(null);
  const [deviceForStockChange, setDeviceForStockChange] = useState<DispositivoDto | null>(null);
  const [deviceForStockHistory, setDeviceForStockHistory] = useState<DispositivoDto | null>(null);

  // Import modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportResultsModalOpen, setIsImportResultsModalOpen] = useState(false);
  const [isImportProcessingModalOpen, setIsImportProcessingModalOpen] = useState(false);
  const [importJobId, setImportJobId] = useState<string | undefined>(undefined);
  const [importResults, setImportResults] = useState<ImportarExcelResponse | null>(null);

  const { job: polledJob } = useImportJobPolling(
    isImportProcessingModalOpen ? importJobId : undefined
  );

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  const { can } = usePermissions();

  const [searchParams, setSearchParams] = useSearchParams();
  const urlFiltroId = searchParams.get('filtroId') ?? undefined;

  const clearDirectFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('filtroId');
    setSearchParams(newParams, { replace: true });
  };

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare params
      const backendParams: Record<string, string | number | boolean> = {
        ...paginationParams,
      };
      // Si hay filtroId (navegaciÃ³n directa desde conductores), no aplicar soloActivos
      // para evitar excluir dispositivos inactivos que el usuario busca explÃ­citamente
      if (filters.soloActivos !== undefined && !urlFiltroId) {
        backendParams.soloActivos = filters.soloActivos === 'true';
      }
      if (urlFiltroId) {
        backendParams.filtroId = urlFiltroId;
      }

      const result = await dispositivosApi.getDispositivos(backendParams);
      setDevicesData(result);
    } catch (e) {
      const parsed = handleApiError(e, { showToast: false });
      setError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  }, [paginationParams, filters, handleApiError, urlFiltroId]);

  // Extraer items para compatibilidad
  const devices = devicesData?.items ?? [];

  // Cargar dispositivos al montar el componente
  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);


  // Ajustar automÃ¡ticamente si la pÃ¡gina actual excede el total de pÃ¡ginas
  useEffect(() => {
    if (
      devicesData &&
      devicesData.paginaActual > devicesData.totalPaginas &&
      devicesData.totalPaginas > 0
    ) {
      setNumeroPagina(devicesData.totalPaginas);
    }
  }, [devicesData, setNumeroPagina]);

  // Permisos
  const canConfigure = can('dispositivos:configurar');
  const canCreate = can('dispositivos:configurar'); // Usar mismo permiso que configurar
  const isPersonalContext =
    user?.contextoActivo?.tipo === 'Personal' ||
    (!!user && !user.organizationId);
  const pageTitle = isPersonalContext ? 'Mis dispositivos' : t('devices.title');
  const pageSubtitle = isPersonalContext
    ? t('devices.personal.subtitle', { defaultValue: 'Registra y sigue dispositivos propios. Las superficies empresariales como stock masivo o importaciones quedan fuera del contexto personal.' })
    : t('devices.subtitle');
  const emptyDescription = isPersonalContext
    ? t('devices.personal.emptyDescription', { defaultValue: 'Todavia no vinculaste dispositivos propios. Suma el primero para habilitar seguimiento, asignaciones y mapa dentro de tu cuenta.' })
    : t('devices.emptyDescription');

  const handleCreateDevice = async () => {
    // Validar formulario
    const errors: { traccarDeviceId?: string } = {};
    const traccarDeviceIdNum = Number(createForm.traccarDeviceId);

    if (!createForm.traccarDeviceId || isNaN(traccarDeviceIdNum) || traccarDeviceIdNum <= 0) {
      errors.traccarDeviceId = t('devices.form.traccarIdError');
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setIsCreating(true);
    setCreateErrors({});

    try {
      await dispositivosApi.createDispositivo(
        traccarDeviceIdNum,
        createForm.alias.trim() || undefined,
        createForm.numeroTelefono.trim() || undefined
      );

      toast.success(t('devices.success.created'));
      setIsCreateModalOpen(false);
      setCreateForm({ traccarDeviceId: '', alias: '', numeroTelefono: '' });

      // Refetch lista
      await loadDevices();
    } catch (e) {
      // Mantener contexto en Dispositivos, usando modal para errores graves.
      handleApiError(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (device: DispositivoDto) => {
    setEditingDevice(device);
    setEditForm({
      alias: device.nombre, // El nombre puede ser el alias o "Dispositivo {id}"
      activo: device.activo,
      numeroTelefono: device.numeroTelefono ?? '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateDevice = async () => {
    if (!editingDevice) return;

    setIsUpdating(true);

    try {
      await dispositivosApi.updateDispositivo(
        editingDevice.id,
        editForm.alias.trim() || undefined,
        editForm.activo,
        editForm.numeroTelefono.trim() || undefined
      );

      toast.success(t('devices.success.updated'));
      setIsEditModalOpen(false);
      setEditingDevice(null);

      // Refetch lista
      await loadDevices();
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenDelete = (device: DispositivoDto) => {
    setDeviceToDelete(device);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;

    setIsDeleting(true);

    try {
      await dispositivosApi.deleteDispositivo(deviceToDelete.id);

      toast.success(t('devices.success.deleted'));
      setIsDeleteModalOpen(false);
      setDeviceToDelete(null);

      // Refetch lista
      await loadDevices();
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // When polled job completes, show results modal and toast
  useEffect(() => {
    if (!polledJob || !isImportProcessingModalOpen) return;
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
      void loadDevices();
      if (isFailed) {
        toast.error(polledJob.mensajeError ?? t('imports.processing.failed'));
      } else if ((polledJob.filasConErrores ?? 0) === 0) {
        toast.success(t('imports.results.allSuccess'));
      } else {
        toast.success(
          t('imports.results.importedCount', {
            count: polledJob.filasExitosas ?? 0,
          })
        );
      }
    }
  }, [polledJob, isImportProcessingModalOpen, t, loadDevices]);

  // Import handler
  const handleImportDevices = async (file: File) => {
    try {
      const results = await reportesApi.importDispositivosExcel(file);
      if (results.jobId) {
        setImportJobId(results.jobId);
        setIsImportProcessingModalOpen(true);
        await loadDevices();
      } else {
        setImportResults(results);
        setIsImportResultsModalOpen(true);
        await loadDevices();
        if (results.filasConErrores === 0) {
          toast.success(t('imports.results.allSuccess'));
        } else {
          toast.success(
            t('imports.results.importedCount', {
              count: results.filasExitosas,
            })
          );
        }
      }
    } catch (e) {
      handleApiError(e);
      throw e;
    }
  };

  // Export handler
  const handleExportDevices = async () => {
    setIsExporting(true);
    try {
      // Exportar segÃºn los filtros aplicados (si hay filtro de soloActivos, usarlo; si no, exportar todos)
      const soloActivos = filters.soloActivos === 'true';
      const blob = await reportesApi.exportDispositivosExcel(soloActivos);
      downloadBlob(blob, 'dispositivos.xlsx');
      toast.success(t('imports.exportSuccess'));
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsExporting(false);
    }
  };

  const getEstadoBadge = (estadoConexion: string | null) => {
    if (!estadoConexion) return <Badge variant="info">{t('devices.unknownStatus')}</Badge>;
    switch (estadoConexion) {
      case 'online': return <Badge variant="success">{t('devices.onlineStatus')}</Badge>;
      case 'offline': return <Badge variant="error">{t('devices.offlineStatus')}</Badge>;
      default: return <Badge variant="info">{estadoConexion}</Badge>;
    }
  };

  const columns = [
    { key: 'nombre', header: t('devices.name'), sortable: true },
    {
      key: 'estadoConexion',
      header: t('devices.connection'),
      render: (d: DispositivoDto) => getEstadoBadge(d.estadoConexion)
    },
    {
      key: 'activo',
      header: t('devices.status'),
      render: (d: DispositivoDto) => (
        d.activo ? <Badge variant="success">{t('common.active')}</Badge> : <Badge variant="error">{t('common.inactive')}</Badge>
      )
    },
    {
      key: 'compartidoCon',
      header: t('devices.sharing'),
      render: (d: DispositivoDto) => {
        // Si es recurso asociado, mostrar badge indicando que viene de otra org
        if (d.esRecursoAsociado) {
          return (
            <div className="flex flex-col gap-1 items-start">
              <Badge variant="warning">
                {t('devices.table.associated')}
              </Badge>
              {d.permisoAcceso === NivelPermisoCompartido.GestionOperativa ? (
                <Badge variant="success">{t('permissions.operational')}</Badge>
              ) : (
                <Badge variant="default">{t('permissions.readOnly')}</Badge>
              )}
            </div>
          );
        }
        // Si estÃ¡ compartido con otras organizaciones
        if (d.compartidoCon?.estaCompartido) {
          const { cantidadOrganizaciones, organizaciones } = d.compartidoCon;
          const nombresOrgs = organizaciones.map(o => o.nombre).join(', ');
          const titulo = cantidadOrganizaciones > 3
            ? `${nombresOrgs} (+${cantidadOrganizaciones - 3} ${t('common.more')})`
            : nombresOrgs;
          return (
            <button
              onClick={() => setDeviceToShare(d)}
              title={titulo}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Share2 size={14} className="text-primary" />
              <Badge variant="info">
                {cantidadOrganizaciones}
              </Badge>
            </button>
          );
        }
        // No compartido - clickeable para abrir modal
        return (
          <button
            onClick={() => setDeviceToShare(d)}
            className="text-text-muted hover:text-primary transition-colors cursor-pointer"
            title={t('devices.table.manageSharing')}
          >
            â€”
          </button>
        );
      },
    },
    {
      key: 'estadoStock',
      header: t('devices.stock.statusLabel'),
      render: (d: DispositivoDto) => (
        <Badge variant={stockBadgeVariants[d.estadoStock]}>
          {t(stockStatusLabels[d.estadoStock])}
        </Badge>
      )
    },
    {
      key: 'ultimaActualizacionUtc',
      header: t('devices.lastUpdate'),
      render: (d: DispositivoDto) => d.ultimaActualizacionUtc
        ? formatDateTime(d.ultimaActualizacionUtc, culture, timeZoneId)
        : '-'
    },
    {
      key: 'actions',
      header: t('devices.actions'),
      render: (d: DispositivoDto) => {
        // Sin permiso de configurar, no mostrar acciones
        if (!canConfigure) return null;

        return (
          <div className="flex items-center gap-2">
            {/* QR Code */}
            {!isPersonalContext && !d.esRecursoAsociado && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeviceForQr(d)}
                title={t('devices.qr.viewQr')}
              >
                <QrCode size={16} className="text-primary" />
              </Button>
            )}
            {/* Stock Change */}
            {!isPersonalContext && !d.esRecursoAsociado && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeviceForStockChange(d)}
                title={t('devices.stock.changeStock')}
              >
                <Package size={16} />
              </Button>
            )}
            {/* Stock History */}
            {!isPersonalContext && !d.esRecursoAsociado && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeviceForStockHistory(d)}
                title={t('devices.stock.viewHistory')}
              >
                <History size={16} />
              </Button>
            )}
            {/* Sharing */}
            {!isPersonalContext && !d.esRecursoAsociado && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeviceToShare(d)}
                title={t('devices.table.manageSharing')}
              >
                <Share2 size={16} className="text-primary" />
              </Button>
            )}
            {/* Edit - Solo Owner */}
            {!d.esRecursoAsociado && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(d)}
                title={t('devices.editDevice')}
              >
                <Edit size={16} />
              </Button>
            )}
            {/* Delete - Solo Owner */}
            {!d.esRecursoAsociado && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenDelete(d)}
                title={t('devices.deleteDevice')}
              >
                <Trash2 size={16} className="text-error" />
              </Button>
            )}
          </div>
        );
      }
    },
  ];
  const visibleColumns = isPersonalContext
    ? columns.filter((column) => column.key !== 'compartidoCon' && column.key !== 'estadoStock')
    : columns;

  // Modales que deben estar siempre disponibles independientemente del estado de la pÃ¡gina
  const modals = (
    <>
      {/* Modal de creaciÃ³n */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateForm({ traccarDeviceId: '', alias: '', numeroTelefono: '' });
          setCreateErrors({});
        }}
        title={t('devices.createDevice')}
      >
        <div className="space-y-4">
          <Input
            label={t('devices.form.traccarId')}
            type="number"
            value={createForm.traccarDeviceId}
            onChange={(e) => setCreateForm({ ...createForm, traccarDeviceId: e.target.value })}
            placeholder={t('devices.form.traccarIdPlaceholder')}
            error={createErrors.traccarDeviceId}
            helperText={t('devices.form.traccarIdHelper')}
            required
          />
          <Input
            label={t('devices.form.alias')}
            type="text"
            value={createForm.alias}
            onChange={(e) => setCreateForm({ ...createForm, alias: e.target.value })}
            placeholder={t('devices.form.aliasPlaceholder')}
            helperText={t('devices.form.aliasHelper')}
          />
          <Input
            label={t('devices.form.phoneNumber')}
            type="tel"
            value={createForm.numeroTelefono}
            onChange={(e) => setCreateForm({ ...createForm, numeroTelefono: e.target.value })}
            placeholder={t('devices.form.phoneNumberPlaceholder')}
            helperText={t('devices.form.phoneNumberHelper')}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setCreateForm({ traccarDeviceId: '', alias: '', numeroTelefono: '' });
                setCreateErrors({});
              }}
              disabled={isCreating}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateDevice} disabled={isCreating}>
              {isCreating ? t('devices.creating') : t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      {!isPersonalContext && (
        <>
          <ImportExcelModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleImportDevices}
            title={t('imports.importDevices')}
            onDownloadTemplate={async () => {
              const blob = await reportesApi.downloadTemplateDispositivosExcel();
              downloadBlob(blob, 'template_dispositivos.xlsx');
            }}
            templateLabel={t('imports.downloadDeviceTemplate')}
          />

          <ImportProcessingModal
            isOpen={isImportProcessingModalOpen}
            tipoImportacion={t('imports.importDevices')}
          />

          {importResults && (
            <ImportResultsModal
              isOpen={isImportResultsModalOpen}
              onClose={() => {
                setIsImportResultsModalOpen(false);
                setImportResults(null);
              }}
              results={importResults}
              tipoImportacion={t('imports.importDevices')}
            />
          )}
        </>
      )}
    </>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{pageTitle}</h1>
            <p className="text-text-muted mt-1">{pageSubtitle}</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-text-muted mt-4">{t('devices.loading')}</p>
            </div>
          </div>
        </Card>
        {modals}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{pageTitle}</h1>
            <p className="text-text-muted mt-1">{pageSubtitle}</p>
          </div>
          {canCreate && (
            <div className="flex items-center gap-2">
              {!isPersonalContext && (
                <>
                  <Button variant="outline" onClick={handleExportDevices} isLoading={isExporting} disabled={isExporting}>
                    <Download size={16} className="mr-2" />
                    {t('imports.export')}
                  </Button>
                  <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                    <Upload size={16} className="mr-2" />
                    {t('imports.import')}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-error mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{t('devices.loadError')}</h3>
            <p className="text-text-muted mb-6 text-center max-w-md">{error}</p>
            <Button onClick={loadDevices}>{t('devices.retry')}</Button>
          </div>
        </Card>
        {modals}
      </div>
    );
  }

  // Empty state
  if (devices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{pageTitle}</h1>
            <p className="text-text-muted mt-1">{pageSubtitle}</p>
          </div>
          {canCreate && (
            <div className="flex items-center gap-2">
              {!isPersonalContext && (
                <>
                  <Button variant="outline" onClick={handleExportDevices} isLoading={isExporting} disabled={isExporting}>
                    <Download size={16} className="mr-2" />
                    {t('imports.export')}
                  </Button>
                  <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                    <Upload size={16} className="mr-2" />
                    {t('imports.import')}
                  </Button>
                </>
              )}
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                {t('devices.createDevice')}
              </Button>
            </div>
          )}
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Settings size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{t('devices.emptyTitle')}</h3>
            <p className="text-text-muted text-center max-w-md mb-4">
              {emptyDescription}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {canCreate && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  {t('devices.createDevice')}
                </Button>
              )}
              <RouterLink
                to="/vehiculos"
                className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-4 py-2 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
              >{t('devices.viewVehicles', { defaultValue: 'Ver vehiculos' })}</RouterLink>
            </div>
          </div>
        </Card>
        {modals}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{pageTitle}</h1>
          <p className="text-text-muted mt-1">{pageSubtitle}</p>
        </div>
        {canCreate && (
          <div className="flex items-center gap-2">
            {!isPersonalContext && (
              <>
                <Button variant="outline" onClick={handleExportDevices} isLoading={isExporting} disabled={isExporting}>
                  <Download size={16} className="mr-2" />
                  {t('imports.export')}
                </Button>
                <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                  <Upload size={16} className="mr-2" />
                  {t('imports.import')}
                </Button>
              </>
            )}
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              {t('devices.createDevice')}
            </Button>
          </div>
        )}
      </div>

      {urlFiltroId && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm text-text">
          <AlertCircle size={16} className="text-primary shrink-0" />
          <span>{t('filters.filteringByDirectLink')}</span>
          <Button size="sm" variant="ghost" onClick={clearDirectFilter}>
            {t('filters.clearDirectFilter')}
          </Button>
        </div>
      )}

      <AdvancedFilterBar
        config={getDeviceFiltersConfig(t)}
        filters={filters}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Settings size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{devicesData?.totalRegistros ?? devices.length}</p>
              <p className="text-sm text-text-muted">{t('devices.totalDevices', { count: devicesData?.totalRegistros ?? devices.length })}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <Wifi size={24} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {devices.filter(d => d.estadoConexion === 'online').length}
              </p>
              <p className="text-sm text-text-muted">{t('devices.devicesOnline', { count: devices.filter(d => d.estadoConexion === 'online').length })} <span className="text-xs opacity-60">({t('common.currentPage')})</span></p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-error/10">
              <WifiOff size={24} className="text-error" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {devices.filter(d => d.estadoConexion === 'offline').length}
              </p>
              <p className="text-sm text-text-muted">{t('devices.devicesOffline', { count: devices.filter(d => d.estadoConexion === 'offline').length })} <span className="text-xs opacity-60">({t('common.currentPage')})</span></p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Settings size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {devices.filter(d => d.estadoConexion !== 'online' && d.estadoConexion !== 'offline').length}
              </p>
              <p className="text-sm text-text-muted">{t('devices.available')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <div>
        <Card padding="none">
          <Table
            columns={visibleColumns}
            data={devices}
            keyExtractor={(d) => d.id}
          />
          {/* Controles de paginaciÃ³n */}
          {devicesData && devicesData.totalRegistros > 0 && (
            <PaginationControls
              paginaActual={devicesData.paginaActual}
              totalPaginas={devicesData.totalPaginas}
              tamanoPagina={devicesData.tamanoPagina}
              totalRegistros={devicesData.totalRegistros}
              onPageChange={setNumeroPagina}
              onPageSizeChange={setTamanoPagina}
              disabled={isLoading}
            />
          )}
        </Card>
      </div>

      {/* Modal de ediciÃ³n */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDevice(null);
        }}
        title={t('devices.editDevice')}
      >
        <div className="space-y-4">
          {/* IMEI Info - Read only */}
          {editingDevice && (
            <div className="p-3 bg-background rounded-lg border border-border">
              <p className="text-xs text-text-muted mb-1">{t('devices.form.imeiLabel')}</p>
              <p className="text-sm font-mono font-medium text-text">
                {editingDevice.uniqueId || editingDevice.nombre}
              </p>
            </div>
          )}

          <Input
            label={t('devices.form.aliasLabel')}
            type="text"
            value={editForm.alias}
            onChange={(e) => setEditForm({ ...editForm, alias: e.target.value })}
            placeholder={t('devices.form.aliasPlaceholder')}
            helperText={t('devices.form.aliasHelper')}
          />
          <Input
            label={t('devices.form.phoneNumber')}
            type="tel"
            value={editForm.numeroTelefono}
            onChange={(e) => setEditForm({ ...editForm, numeroTelefono: e.target.value })}
            placeholder={t('devices.form.phoneNumberPlaceholder')}
            helperText={t('devices.form.phoneNumberHelper')}
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activo-edit"
              checked={editForm.activo}
              onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="activo-edit" className="text-sm text-text">
              {t('devices.form.active')}
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingDevice(null);
              }}
              disabled={isUpdating}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdateDevice} disabled={isUpdating}>
              {isUpdating ? t('devices.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmaciÃ³n de eliminaciÃ³n */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeviceToDelete(null);
        }}
        onConfirm={handleDeleteDevice}
        title={t('devices.deleteDevice')}
        description={t('devices.confirmDelete', { nombre: deviceToDelete?.nombre || '' })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Modal de GestiÃ³n de ComparticiÃ³n */}
      {!isPersonalContext && deviceToShare && (
        <GestionarComparticionModal
          isOpen={!!deviceToShare}
          onClose={() => setDeviceToShare(null)}
          resourceId={deviceToShare.id}
          resourceType={3 as TipoRecurso} // TipoRecurso.DispositivoTraccar
          resourceName={deviceToShare.nombre}
          onSuccess={loadDevices}
        />
      )}

      {/* QR Modal */}
      {!isPersonalContext && (
        <>
          <DeviceQrModal
            device={deviceForQr}
            isOpen={!!deviceForQr}
            onClose={() => setDeviceForQr(null)}
          />

          <DeviceStockChangeModal
            device={deviceForStockChange}
            isOpen={!!deviceForStockChange}
            onClose={() => setDeviceForStockChange(null)}
            onSuccess={loadDevices}
          />

          <DeviceStockHistoryModal
            device={deviceForStockHistory}
            isOpen={!!deviceForStockHistory}
            onClose={() => setDeviceForStockHistory(null)}
          />
        </>
      )}

      {modals}
    </div>
  );
}

