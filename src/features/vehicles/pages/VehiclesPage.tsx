import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Plus, Edit, Trash2, AlertCircle, Link, Unlink, Share2 } from 'lucide-react';
import { Card, Table, Badge, Button, Modal, Input, ConfirmationModal, PaginationControls, AdvancedFilterBar, FilterConfig } from '@/shared/ui';
import { vehiculosApi, dispositivosApi } from '@/services/endpoints';
import { usePermissions, usePaginationParams, useLocalization, useErrorHandler, useTableFilters } from '@/hooks';
import { toast } from '@/store/toast.store';
import type {
  VehiculoDto,
  TipoVehiculo,
} from '../types';
import type { DispositivoDto, ListaPaginada, TipoRecurso } from '@/shared/types/api';
import { NivelPermisoCompartido } from '@/shared/types/api';
import { formatDate } from '@/shared/utils';
import { GestionarComparticionModal } from '@/features/organization';
import { CreateVehicleModal } from '../components/CreateVehicleModal';

const vehicleFiltersConfig: FilterConfig[] = [
  { key: 'patente', label: 'Patente / License Plate', type: 'text', placeholder: 'AA000AA' },
  { key: 'marca', label: 'Marca / Brand', type: 'text' },
  { key: 'modelo', label: 'Modelo / Model', type: 'text' },
  { key: 'anio', label: 'Año / Year', type: 'number' },
  { key: 'activo', label: 'Estado / Status', type: 'boolean' },
];

export function VehiclesPage() {
  const { t } = useTranslation();
  const localization = useLocalization();
  const culture = localization.culture;
  const timeZoneId = localization.timeZoneId;
  const { getErrorMessage } = useErrorHandler();
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

  const { can } = usePermissions();
  const canEdit = can('vehiculos:editar');
  const canCreate = can('vehiculos:crear');
  const canDelete = can('vehiculos:eliminar');

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehiculosResult, devicesResult] = await Promise.all([
        vehiculosApi.getVehiculos({ ...paginationParams, ...filterParams }),
        dispositivosApi.getDispositivos({ tamanoPagina: 50 }), // Dispositivos sin paginar (para select)
      ]);
      setVehiclesData(vehiculosResult);
      setDevices(devicesResult.items);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [paginationParams, filterParams]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
      toast.error(getErrorMessage(e));
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
      toast.error(getErrorMessage(e));
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
      toast.error(getErrorMessage(e));
    } finally {
      setIsAssigning(false);
    }
  };

  const vehicles = vehiclesData?.items ?? [];

  const getDeviceName = (deviceId: string | null) => {
    if (!deviceId) return null;
    const device = devices.find(d => d.id === deviceId);
    return device?.nombre || device?.uniqueId || t('vehicles.deviceName');
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
        // Prioritize name from DTO (supports shared devices not in local list)
        const deviceName = v.dispositivoActivoNombre || getDeviceName(v.dispositivoActivoId);
        return deviceName ? (
          <Badge variant="info">{deviceName}</Badge>
        ) : (
          <span className="text-text-muted">{t('vehicles.table.unassigned')}</span>
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

  const hasActiveFilters = Object.keys(filters).length > 0;

  if (vehicles.length === 0 && !hasActiveFilters) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('vehicles.title')}</h1>
            <p className="text-text-muted mt-1">{t('vehicles.subtitle')}</p>
          </div>
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              {t('vehicles.createVehicle')}
            </Button>
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
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            {t('vehicles.createVehicle')}
          </Button>
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
              <p className="text-sm text-text-muted">{t('vehicles.withDevice')}</p>
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
              <p className="text-sm text-text-muted">{t('vehicles.withoutDevice')}</p>
            </div>
          </div>
        </Card>
      </div>

      <AdvancedFilterBar
        config={vehicleFiltersConfig}
        filters={filters}
        onFilterChange={(key, value) => {
          const op = ['activo', 'anio'].includes(key) ? 'eq' : 'contains';
          setFilter(key, value, op);
        }}
        onClearFilters={clearFilters}
      />

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
    </div>
  );
}
