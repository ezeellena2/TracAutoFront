import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Car, Plus, Edit, Trash2, AlertCircle, Link, Unlink, Share2, Upload, Download } from 'lucide-react';
import { Card, Table, Badge, Button, Modal, Input, PaginationControls, AdvancedFilterBar, FilterConfig, ImportExcelModal, ImportResultsModal, ImportProcessingModal } from '@/shared/ui';
import { ConfirmationModal } from '@/shared/ui/ConfirmationModal';
import { vehiculosApi, dispositivosApi, reportesApi } from '@/services/endpoints';
import type { ImportarExcelResponse } from '@/services/endpoints/reportes.api';
import { usePermissions, usePaginationParams, useLocalization, useErrorHandler, useTableFilters, useImportJobPolling } from '@/hooks';
import { toast } from '@/store/toast.store';
import type {
  VehiculoDto,
  TipoVehiculo,
} from '../types';
import type { DispositivoDto, ListaPaginada, TipoRecurso } from '@/shared/types/api';
import { NivelPermisoCompartido } from '@/shared/types/api';
import { formatDate } from '@/shared/utils';
import { downloadBlob } from '@/shared/utils/fileUtils';
import { GestionarComparticionModal } from '@/features/organization';
import type { ConductorVehiculoAsignacionDto } from '@/features/drivers/types';
import { CreateVehicleModal } from '../components/CreateVehicleModal';
import { VehicleConductorsModal } from '../components/VehicleConductorsModal';

// FIX-6: Usar función factory con t() para i18n en labels de filtros
const getVehicleFiltersConfig = (t: (key: string, options?: Record<string, string>) => string): FilterConfig[] => [
  { key: 'patente', label: t('vehicles.filters.licensePlate', { defaultValue: 'Patente' }), type: 'text', placeholder: 'AA000AA' },
  { key: 'marca', label: t('vehicles.filters.brand', { defaultValue: 'Marca' }), type: 'text' },
  { key: 'modelo', label: t('vehicles.filters.model', { defaultValue: 'Modelo' }), type: 'text' },
  { key: 'anio', label: t('vehicles.filters.year', { defaultValue: 'Año' }), type: 'number' },
  { key: 'activo', label: t('vehicles.filters.status', { defaultValue: 'Estado' }), type: 'boolean' },
];

export function VehiclesPage() {
  const { t } = useTranslation();
  const localization = useLocalization();
  const culture = localization.culture;
  const timeZoneId = localization.timeZoneId;
  const { handleApiError } = useErrorHandler();
  // Data state
  const [vehiclesData, setVehiclesData] = useState<ListaPaginada<VehiculoDto> | null>(null);
  const [devices, setDevices] = useState<DispositivoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination hook
  const {
    setNumeroPagina,
    setTamanoPagina,
    params: paginationParams
  } = usePaginationParams({ initialPageSize: 10 });

  // Filters hook
  const {
    filters,
    setFilter,
    clearFilters,
    queryParams: filterParams
  } = useTableFilters();

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehiculoDto | null>(null);
  const [editForm, setEditForm] = useState({
    tipo: 1 as TipoVehiculo,
    patente: '',
    marca: '',
    modelo: '',
    anio: undefined as number | undefined,
    activo: true,
  });

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<VehiculoDto | null>(null);

  // Assign device modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [vehicleToAssign, setVehicleToAssign] = useState<VehiculoDto | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  // Sharing modal
  const [vehicleToShare, setVehicleToShare] = useState<VehiculoDto | null>(null);

  // Conductors modal (ver conductores asignados al vehículo)
  const [vehicleForConductorsModal, setVehicleForConductorsModal] = useState<VehiculoDto | null>(null);
  const [vehicleConductorsCache, setVehicleConductorsCache] = useState<Record<string, ConductorVehiculoAsignacionDto[]>>({});

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
  const canEdit = can('vehiculos:editar');
  const canCreate = can('vehiculos:crear');
  const canDelete = can('vehiculos:eliminar');

  const [searchParams, setSearchParams] = useSearchParams();
  const urlFiltroId = searchParams.get('filtroId') ?? undefined;

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiParams: Parameters<typeof vehiculosApi.getVehiculos>[0] = {
        ...paginationParams,
        filterParams,
        filtroId: urlFiltroId,
      };
      const [vehiculosResult, devicesResult] = await Promise.all([
        vehiculosApi.getVehiculos(apiParams),
        dispositivosApi.getDispositivos({ tamanoPagina: 50 }),
      ]);
      setVehiclesData(vehiculosResult);
      setDevices(devicesResult.items);
    } catch (e) {
      const parsed = handleApiError(e, { showToast: false });
      setError(parsed.message);
    } finally {
      setIsLoading(false);
      setVehicleConductorsCache({});
    }
  }, [paginationParams, filterParams, handleApiError, urlFiltroId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Precargar conductores por vehículo en una sola petición batch (evita N+1)
  useEffect(() => {
    const items = vehiclesData?.items ?? [];
    if (items.length === 0) return;
    const ids = items.map((v) => v.id);
    let cancelled = false;
    vehiculosApi
      .getConductoresAsignadosBatch(ids, true)
      .then((batch) => {
        if (cancelled) return;
        const newCache: Record<string, ConductorVehiculoAsignacionDto[]> = {};
        batch.forEach((item) => {
          newCache[item.vehiculoId] = item.conductores ?? [];
        });
        setVehicleConductorsCache((prev) => ({ ...prev, ...newCache }));
      })
      .catch((e) => handleApiError(e));
    return () => {
      cancelled = true;
    };
  }, [vehiclesData, handleApiError]);

  // Adjust page if out of bounds
  useEffect(() => {
    if (
      vehiclesData &&
      vehiclesData.paginaActual > vehiclesData.totalPaginas &&
      vehiclesData.totalPaginas > 0
    ) {
      setNumeroPagina(vehiclesData.totalPaginas);
    }
  }, [vehiclesData, setNumeroPagina]);



  // Edit handlers
  const handleOpenEdit = (vehicle: VehiculoDto) => {
    setEditingVehicle(vehicle);
    setEditForm({
      tipo: vehicle.tipo,
      patente: vehicle.patente,
      marca: vehicle.marca || '',
      modelo: vehicle.modelo || '',
      anio: vehicle.anio || undefined,
      activo: vehicle.activo,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingVehicle) return;
    setIsUpdating(true);
    try {
      await vehiculosApi.updateVehiculo(editingVehicle.id, {
        id: editingVehicle.id,
        tipo: editForm.tipo,
        patente: editForm.patente.trim().toUpperCase(),
        marca: editForm.marca?.trim() || undefined,
        modelo: editForm.modelo?.trim() || undefined,
        anio: editForm.anio,
        activo: editForm.activo,
      });
      toast.success(t('vehicles.success.updated'));
      setIsEditModalOpen(false);
      setEditingVehicle(null);
      await loadData();
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete handlers
  const handleOpenDelete = (vehicle: VehiculoDto) => {
    setVehicleToDelete(vehicle);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);
    try {
      await vehiculosApi.deleteVehiculo(vehicleToDelete.id);
      toast.success(t('vehicles.success.deleted'));
      setIsDeleteModalOpen(false);
      setVehicleToDelete(null);
      await loadData();
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Assign device handlers
  const handleOpenAssign = (vehicle: VehiculoDto) => {
    setVehicleToAssign(vehicle);
    setSelectedDeviceId(vehicle.dispositivoActivoId || '');
    setIsAssignModalOpen(true);
  };

  const handleAssignDevice = async () => {
    if (!vehicleToAssign) return;

    const currentDeviceId = vehicleToAssign.dispositivoActivoId || '';

    if (selectedDeviceId === currentDeviceId) {
      setIsAssignModalOpen(false);
      setVehicleToAssign(null);
      return;
    }

    setIsAssigning(true);
    try {
      if (selectedDeviceId) {
        await vehiculosApi.assignDispositivo(vehicleToAssign.id, {
          dispositivoId: selectedDeviceId,
        });
        toast.success(t('vehicles.success.assigned'));
      } else if (currentDeviceId) {
        await vehiculosApi.unassignDispositivo(
          vehicleToAssign.id,
          currentDeviceId
        );
        toast.success(t('vehicles.success.unassigned'));
      }
      setIsAssignModalOpen(false);
      setVehicleToAssign(null);
      await loadData();
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsAssigning(false);
    }
  };

  // When polled job completes, show results modal and toast
  useEffect(() => {
    if (!polledJob || !isImportProcessingModalOpen) return;
    const isCompleted = polledJob.estado === 2; // EstadoImportacionJob.Completado
    const isFailed = polledJob.estado === 3; // EstadoImportacionJob.Fallido
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
      void loadData();
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
  }, [polledJob, isImportProcessingModalOpen, t, loadData]);

  // Import handler
  const handleImportVehicles = async (file: File) => {
    try {
      const results = await reportesApi.importVehiculosExcel(file);
      if (results.jobId) {
        setImportJobId(results.jobId);
        setIsImportProcessingModalOpen(true);
        await loadData();
      } else {
        setImportResults(results);
        setIsImportResultsModalOpen(true);
        await loadData();
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
      handleApiError(e);
      throw e;
    }
  };

  // Export handler
  const handleExportVehicles = async () => {
    setIsExporting(true);
    try {
      // Exportar todos los vehículos (el backend puede filtrar después si es necesario)
      const blob = await reportesApi.exportVehiculosExcel(false);
      downloadBlob(blob, 'vehiculos.xlsx');
      toast.success(t('imports.exportSuccess', { defaultValue: 'Vehículos exportados exitosamente' }));
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsExporting(false);
    }
  };

  const vehicles = vehiclesData?.items ?? [];

  const getDeviceIdentifier = (v: VehiculoDto): string | null => {
    if (!v.dispositivoActivoId) return null;
    const device = devices.find(d => d.id === v.dispositivoActivoId);
    if (device?.uniqueId) return device.uniqueId;
    const name = v.dispositivoActivoNombre;
    if (!name) return null;
    const match = name.replace(/^(?:Dispositivo|Device)\s+/i, '').trim();
    return match || name;
  };

  const columns = [
    {
      key: 'patente',
      header: t('vehicles.licensePlate'),
      sortable: true,
    },
    {
      key: 'vehiculo',
      header: t('vehicles.vehicle'),
      render: (v: VehiculoDto) => {
        const parts = [v.marca, v.modelo, v.anio].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : '-';
      },
    },
    {
      key: 'dispositivo',
      header: t('vehicles.device'),
      render: (v: VehiculoDto) => {
        const identifier = getDeviceIdentifier(v);
        return identifier ? (
          <Badge variant="info">{identifier}</Badge>
        ) : (
          <span className="text-text-muted">{t('vehicles.table.unassigned')}</span>
        );
      },
    },
    {
      key: 'conductores',
      header: t('vehicles.table.drivers'),
      render: (v: VehiculoDto) => {
        const list = vehicleConductorsCache[v.id];
        const handleClick = () => setVehicleForConductorsModal(v);
        if (list !== undefined) {
          if (list.length === 0) {
            return <span className="text-text-muted">—</span>;
          }
          return (
            <button
              type="button"
              onClick={handleClick}
              className="inline-flex items-center justify-center min-w-[1.75rem] h-7 rounded-full bg-primary/15 text-primary text-sm font-semibold hover:bg-primary/25 transition-colors"
              title={t('vehicles.table.viewDrivers')}
            >
              {list.length}
            </button>
          );
        }
        return (
          <span className="text-text-muted text-sm">—</span>
        );
      },
    },
    {
      key: 'activo',
      header: t('vehicles.status'),
      render: (v: VehiculoDto) => (
        <Badge variant={v.activo ? 'success' : 'error'}>
          {v.activo ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      key: 'compartidoCon',
      header: t('vehicles.sharing'),
      render: (v: VehiculoDto) => {
        // Si es recurso asociado, mostrar badge indicando que viene de otra org
        if (v.esRecursoAsociado) {
          return (
            <div className="flex flex-col gap-1 items-start">
              <Badge variant="warning">
                {t('vehicles.table.associated')}
              </Badge>
              {v.permisoAcceso === NivelPermisoCompartido.GestionOperativa ? (
                <Badge variant="success">{t('permissions.operational')}</Badge>
              ) : (
                <Badge variant="default">{t('permissions.readOnly')}</Badge>
              )}
            </div>
          );
        }
        // Si está compartido con otras organizaciones
        if (v.compartidoCon?.estaCompartido) {
          const { cantidadOrganizaciones, organizaciones } = v.compartidoCon;
          const nombresOrgs = organizaciones.map(o => o.nombre).join(', ');
          const titulo = cantidadOrganizaciones > 3
            ? `${nombresOrgs} (+${cantidadOrganizaciones - 3} ${t('common.more')})`
            : nombresOrgs;
          return (
            <button
              onClick={() => setVehicleToShare(v)}
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
            onClick={() => setVehicleToShare(v)}
            className="text-text-muted hover:text-primary transition-colors cursor-pointer"
            title={t('vehicles.table.manageSharing')}
          >
            —
          </button>
        );
      },
    },
    {
      key: 'fechaCreacion',
      header: t('vehicles.created'),
      render: (v: VehiculoDto) => formatDate(v.fechaCreacion, culture, timeZoneId),
    },
    {
      key: 'actions',
      header: t('vehicles.actions'),
      render: (v: VehiculoDto) => (
        <div className="flex items-center gap-1">
          {/* Botón de compartición - solo para recursos propios */}
          {canEdit && !v.esRecursoAsociado && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVehicleToShare(v)}
              title={t('vehicles.table.manageSharing')}
            >
              <Share2 size={16} className="text-primary" />
            </Button>
          )}
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenAssign(v)}
                title={v.dispositivoActivoId ? t('vehicles.table.changeDevice') : t('vehicles.table.assignDevice')}
                disabled={v.esRecursoAsociado && v.permisoAcceso !== NivelPermisoCompartido.GestionOperativa}
              >
                {v.dispositivoActivoId ? <Unlink size={16} /> : <Link size={16} />}
              </Button>
              {/* Editar solo permitido para recursos propios */}
              {!v.esRecursoAsociado && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(v)}
                  title={t('vehicles.table.editVehicle')}
                >
                  <Edit size={16} />
                </Button>
              )}
            </>
          )}
          {/* Eliminar solo permitido para recursos propios */}
          {canDelete && !v.esRecursoAsociado && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDelete(v)}
              title={t('vehicles.table.deleteVehicle')}
            >
              <Trash2 size={16} className="text-error" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('vehicles.title')}</h1>
            <p className="text-text-muted mt-1">{t('vehicles.subtitle')}</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-text-muted mt-4">{t('vehicles.loading')}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('vehicles.title')}</h1>
            <p className="text-text-muted mt-1">{t('vehicles.subtitle')}</p>
          </div>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-error mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{t('vehicles.loadError')}</h3>
            <p className="text-text-muted mb-6 text-center max-w-md">{error}</p>
            <Button onClick={loadData}>{t('vehicles.retry')}</Button>
          </div>
        </Card>
      </div>
    );
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || !!urlFiltroId;

  const clearDirectFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('filtroId');
    setSearchParams(newParams, { replace: true });
  };

  if (vehicles.length === 0 && !hasActiveFilters) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('vehicles.title')}</h1>
            <p className="text-text-muted mt-1">{t('vehicles.subtitle')}</p>
          </div>
          {canCreate && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExportVehicles} isLoading={isExporting}>
                <Download size={16} className="mr-2" />
                {t('imports.export', { defaultValue: 'Exportar' })}
              </Button>
              <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                <Upload size={16} className="mr-2" />
                {t('imports.import', { defaultValue: 'Importar' })}
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                {t('vehicles.createVehicle')}
              </Button>
            </div>
          )}
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Car size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{t('vehicles.emptyTitle')}</h3>
            <p className="text-text-muted text-center max-w-md mb-4">
              {t('vehicles.emptyDescription')}
            </p>
            {canCreate && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                {t('vehicles.createVehicle')}
              </Button>
            )}
          </div>
        </Card>

        {/* Create Modal */}
        <CreateVehicleModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={loadData}
          devices={devices}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('vehicles.title')}</h1>
          <p className="text-text-muted mt-1">{t('vehicles.subtitle')}</p>
        </div>
        {canCreate && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportVehicles} isLoading={isExporting} disabled={isExporting}>
              <Download size={16} className="mr-2" />
              {t('imports.export', { defaultValue: 'Exportar' })}
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload size={16} className="mr-2" />
              {t('imports.import', { defaultValue: 'Importar' })}
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              {t('vehicles.createVehicle')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Car size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{vehiclesData?.totalRegistros ?? vehicles.length}</p>
              <p className="text-sm text-text-muted">{t('vehicles.totalVehicles')}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <Link size={24} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {vehiclesData?.items.filter((v) => v.dispositivoActivoId).length ?? 0}
              </p>
              <p className="text-sm text-text-muted">{t('vehicles.withDevice')} <span className="text-xs opacity-60">({t('common.currentPage', { defaultValue: 'pág. actual' })})</span></p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <Unlink size={24} className="text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {vehiclesData?.items.filter((v) => !v.dispositivoActivoId).length ?? 0}
              </p>
              <p className="text-sm text-text-muted">{t('vehicles.withoutDevice')} <span className="text-xs opacity-60">({t('common.currentPage', { defaultValue: 'pág. actual' })})</span></p>
            </div>
          </div>
        </Card>
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
        config={getVehicleFiltersConfig(t)}
        filters={filters}
        onFilterChange={(key, value) => {
          const op = 'eq';
          setFilter(key, value, op);
        }}
        onClearFilters={clearFilters}
      />

      <div>
        <Card padding="none">
          <Table
            columns={columns}
            data={vehicles}
            keyExtractor={(v) => v.id}
            enableFilters={false}
            emptyMessage={hasActiveFilters ? t('filters.noResults') : t('common.noData')}
          />
          {vehiclesData && vehiclesData.totalRegistros > 0 && (
            <PaginationControls
              paginaActual={vehiclesData.paginaActual}
              totalPaginas={vehiclesData.totalPaginas}
              tamanoPagina={vehiclesData.tamanoPagina}
              totalRegistros={vehiclesData.totalRegistros}
              onPageChange={setNumeroPagina}
              onPageSizeChange={setTamanoPagina}
              disabled={isLoading}
            />
          )}
        </Card>
      </div>

      {/* Create Modal */}
      <CreateVehicleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadData}
        devices={devices}
      />

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('vehicles.editVehicle')}
      >
        <div className="space-y-4">
          <Input
            label={t('vehicles.form.licensePlate')}
            value={editForm.patente}
            onChange={(e) => setEditForm({ ...editForm, patente: e.target.value })}
            placeholder={t('vehicles.form.licensePlatePlaceholder')}
            required
          />
          <Input
            label={t('vehicles.form.brand')}
            value={editForm.marca}
            onChange={(e) => setEditForm({ ...editForm, marca: e.target.value })}
            placeholder={t('vehicles.form.brandPlaceholder')}
          />
          <Input
            label={t('vehicles.form.model')}
            value={editForm.modelo}
            onChange={(e) => setEditForm({ ...editForm, modelo: e.target.value })}
            placeholder={t('vehicles.form.modelPlaceholder')}
          />
          <Input
            label={t('vehicles.form.year')}
            type="number"
            value={editForm.anio?.toString() || ''}
            onChange={(e) => setEditForm({ ...editForm, anio: e.target.value ? Number(e.target.value) : undefined })}
            placeholder={t('vehicles.form.yearPlaceholder')}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={editForm.activo}
              onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="active" className="text-sm font-medium text-text">
              {t('common.active')}
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? t('vehicles.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('vehicles.deleteTitle')}
        description={t('vehicles.deleteMessage', { patente: vehicleToDelete?.patente })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />

      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={t('vehicles.assignDevice')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('vehicles.selectDevice')}
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('vehicles.form.noDevice')}</option>
              {devices.filter(d => d.activo).map((device) => (
                <option key={device.id} value={device.id}>
                  {device.nombre} {device.uniqueId ? `(${device.uniqueId})` : ''}
                </option>
              ))}
            </select>
            <p className="text-sm text-text-muted mt-2">
              {t('vehicles.assignDescription')}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} disabled={isAssigning}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAssignDevice} disabled={isAssigning}>
              {isAssigning ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Gestión de Compartición */}
      {vehicleToShare && (
        <GestionarComparticionModal
          isOpen={!!vehicleToShare}
          onClose={() => setVehicleToShare(null)}
          resourceId={vehicleToShare.id}
          resourceType={1 as TipoRecurso} // TipoRecurso.Vehiculo
          resourceName={vehicleToShare.patente}
          onSuccess={loadData}
        />
      )}

      {/* Modal Conductores asignados al vehículo (muestra activos + finalizados; no escribe en caché para no alterar el número de la columna) */}
      <VehicleConductorsModal
        isOpen={!!vehicleForConductorsModal}
        vehicle={vehicleForConductorsModal}
        onClose={() => setVehicleForConductorsModal(null)}
        initialData={vehicleForConductorsModal ? vehicleConductorsCache[vehicleForConductorsModal.id] : undefined}
      />

      {/* Import Processing Modal - shown while job runs in background */}
      <ImportProcessingModal
        isOpen={isImportProcessingModalOpen}
        tipoImportacion={t('imports.importVehicles', { defaultValue: 'Vehículos' })}
      />

      {/* Import Modal */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportVehicles}
        title={t('imports.importVehicles', { defaultValue: 'Importar Vehículos' })}
        onDownloadTemplate={async () => {
          const blob = await reportesApi.downloadTemplateVehiculosExcel();
          downloadBlob(blob, 'template_vehiculos.xlsx');
        }}
        templateLabel={t('imports.downloadVehicleTemplate', { defaultValue: 'Template de Vehículos' })}
      />

      {/* Import Results Modal */}
      {importResults && (
        <ImportResultsModal
          isOpen={isImportResultsModalOpen}
          onClose={() => {
            setIsImportResultsModalOpen(false);
            setImportResults(null);
          }}
          results={importResults}
          tipoImportacion={t('imports.importVehicles', { defaultValue: 'Vehículos' })}
        />
      )}
    </div>
  );
}
