import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Plus, Edit, Trash2, AlertCircle, Link, Unlink } from 'lucide-react';
import { Card, Table, Badge, Button, Modal, Input, ConfirmationModal, PaginationControls, OrganizacionAsociadaSelector } from '@/shared/ui';
import { vehiculosApi, dispositivosApi } from '@/services/endpoints';
import { usePermissions, usePaginationParams, useLocalization, useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { VehiculoDto, CreateVehiculoRequest, TipoVehiculo } from '../types';
import type { DispositivoDto, ListaPaginada } from '@/shared/types/api';
import { formatDate } from '@/shared/utils';

export function VehiclesPage() {
  const { t } = useTranslation();
  const localization = useLocalization();
  const culture = localization.culture;
  const timeZoneId = localization.timeZoneId;
  const { getErrorMessage } = useErrorHandler();
  // Data state - ahora guardamos ListaPaginada completa
  const [vehiclesData, setVehiclesData] = useState<ListaPaginada<VehiculoDto> | null>(null);
  const [devices, setDevices] = useState<DispositivoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hook de paginación reutilizable
  const { 
    setNumeroPagina, 
    setTamanoPagina, 
    params: paginationParams 
  } = usePaginationParams({ initialPageSize: 10 });
  
  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateVehiculoRequest>({
    tipo: 1, // Auto
    patente: '',
    marca: '',
    modelo: '',
    año: undefined,
    organizacionAsociadaId: undefined,
  });
  const [createDeviceId, setCreateDeviceId] = useState(''); // Device to assign on create
  const [createErrors, setCreateErrors] = useState<{ patente?: string }>({});
  
  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehiculoDto | null>(null);
  const [editForm, setEditForm] = useState({
    tipo: 1 as TipoVehiculo,
    patente: '',
    marca: '',
    modelo: '',
    año: undefined as number | undefined,
    activo: true,
    organizacionAsociadaId: undefined as string | undefined,
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
  
  const { can } = usePermissions();
  const canEdit = can('vehiculos:editar');
  const canCreate = can('vehiculos:crear');
  const canDelete = can('vehiculos:eliminar');

  // Load data - usa parámetros de paginación dinámicos
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehiculosResult, devicesResult] = await Promise.all([
        vehiculosApi.getVehiculos(paginationParams),
        dispositivosApi.getDispositivos({ tamanoPagina: 50 }), // Dispositivos sin paginar (para select)
      ]);
      setVehiclesData(vehiculosResult);
      setDevices(devicesResult.items);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [paginationParams]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Create handlers
  const handleCreate = async () => {
    const errors: { patente?: string } = {};
    if (!createForm.patente.trim()) {
      errors.patente = t('vehicles.form.required');
    }
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setIsCreating(true);
    setCreateErrors({});
    try {
      // 1. Create vehicle
      const newVehicle = await vehiculosApi.createVehiculo({
        ...createForm,
        patente: createForm.patente.trim().toUpperCase(),
        marca: createForm.marca?.trim() || undefined,
        modelo: createForm.modelo?.trim() || undefined,
        organizacionAsociadaId: createForm.organizacionAsociadaId || undefined,
      });
      
      // 2. If device selected, assign it
      if (createDeviceId) {
        try {
          await vehiculosApi.assignDispositivo(newVehicle.id, {
            dispositivoId: createDeviceId,
          });
          toast.success(t('vehicles.success.createdAndAssigned'));
        } catch (assignError) {
          toast.warning(t('vehicles.success.assignWarning', { message: getErrorMessage(assignError) }));
        }
      } else {
        toast.success(t('vehicles.success.created'));
      }
      
      setIsCreateModalOpen(false);
      setCreateForm({ tipo: 1, patente: '', marca: '', modelo: '', año: undefined, organizacionAsociadaId: undefined });
      setCreateDeviceId('');
      await loadData();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsCreating(false);
    }
  };

  // Edit handlers
  const handleOpenEdit = (vehicle: VehiculoDto) => {
    setEditingVehicle(vehicle);
    setEditForm({
      tipo: vehicle.tipo,
      patente: vehicle.patente,
      marca: vehicle.marca || '',
      modelo: vehicle.modelo || '',
      año: vehicle.año || undefined,
      activo: vehicle.activo,
      organizacionAsociadaId: vehicle.organizacionAsociadaId || undefined,
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
        año: editForm.año,
        activo: editForm.activo,
        organizacionAsociadaId: editForm.organizacionAsociadaId || undefined,
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
    
    // P0 Fix: No-op detection - don't call API if nothing changed
    if (selectedDeviceId === currentDeviceId) {
      setIsAssignModalOpen(false);
      setVehicleToAssign(null);
      return; // No changes, just close modal
    }
    
    setIsAssigning(true);
    try {
      if (selectedDeviceId) {
        // Assign new device (backend handles closing previous if any)
        await vehiculosApi.assignDispositivo(vehicleToAssign.id, {
          dispositivoId: selectedDeviceId,
        });
        toast.success(t('vehicles.success.assigned'));
      } else if (currentDeviceId) {
        // Unassign current device
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

  // Extraer items para compatibilidad (computed desde vehiclesData)
  const vehicles = vehiclesData?.items ?? [];

  // Table helpers
  const getDeviceName = (deviceId: string | null) => {
    if (!deviceId) return null;
    const device = devices.find(d => d.id === deviceId);
    return device?.nombre || device?.uniqueId || t('vehicles.deviceName');
  };

  const columns = [
    { key: 'patente', header: t('vehicles.licensePlate'), sortable: true },
    {
      key: 'vehiculo',
      header: t('vehicles.vehicle'),
      render: (v: VehiculoDto) => {
        const parts = [v.marca, v.modelo, v.año].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : '-';
      },
    },
    {
      key: 'dispositivo',
      header: t('vehicles.device'),
      render: (v: VehiculoDto) => {
        const deviceName = getDeviceName(v.dispositivoActivoId);
        return deviceName ? (
          <Badge variant="info">{deviceName}</Badge>
        ) : (
          <span className="text-text-muted">{t('vehicles.table.unassigned')}</span>
        );
      },
    },
    {
      key: 'organizacionAsociada',
      header: t('vehicles.associatedOrganization'),
      render: (v: VehiculoDto) => {
        if (v.organizacionAsociadaNombre) {
          return (
            <div className="flex items-center gap-2">
              <Badge variant="info">{v.organizacionAsociadaNombre}</Badge>
              {v.esRecursoAsociado && (
                <span className="text-xs text-text-muted">({t('vehicles.sharedResource')})</span>
              )}
            </div>
          );
        }
        return <span className="text-text-muted">-</span>;
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
      key: 'fechaCreacion',
      header: t('vehicles.created'),
      render: (v: VehiculoDto) => formatDate(v.fechaCreacion, culture, timeZoneId),
    },
    {
      key: 'actions',
      header: t('vehicles.actions'),
      render: (v: VehiculoDto) => (
        <div className="flex items-center gap-1">
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenAssign(v)}
                title={v.dispositivoActivoId ? t('vehicles.table.changeDevice') : t('vehicles.table.assignDevice')}
              >
                {v.dispositivoActivoId ? <Unlink size={16} /> : <Link size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(v)}
                title={t('vehicles.table.editVehicle')}
              >
                <Edit size={16} />
              </Button>
            </>
          )}
          {canDelete && (
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

  // Loading state
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

  // Error state
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

  // Empty state
  if (vehicles.length === 0) {
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

        {/* Create Modal (needed even for empty state) */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={t('vehicles.createVehicle')}
        >
          <div className="space-y-4">
            <Input
              label={t('vehicles.form.licensePlate')}
              value={createForm.patente}
              onChange={(e) => setCreateForm({ ...createForm, patente: e.target.value })}
              placeholder={t('vehicles.form.licensePlatePlaceholder')}
              error={createErrors.patente}
              required
            />
            <Input
              label={t('vehicles.form.brand')}
              value={createForm.marca || ''}
              onChange={(e) => setCreateForm({ ...createForm, marca: e.target.value })}
              placeholder={t('vehicles.form.brandPlaceholder')}
            />
            <Input
              label={t('vehicles.form.model')}
              value={createForm.modelo || ''}
              onChange={(e) => setCreateForm({ ...createForm, modelo: e.target.value })}
              placeholder={t('vehicles.form.modelPlaceholder')}
            />
            <Input
              label={t('vehicles.form.year')}
              type="number"
              value={createForm.año?.toString() || ''}
              onChange={(e) => setCreateForm({ ...createForm, año: e.target.value ? Number(e.target.value) : undefined })}
              placeholder={t('vehicles.form.yearPlaceholder')}
            />
            
            {/* Organization selector (optional) */}
            <OrganizacionAsociadaSelector
              value={createForm.organizacionAsociadaId}
              onChange={(orgId) => setCreateForm({ ...createForm, organizacionAsociadaId: orgId })}
            />
            
            {/* Device selector (optional) */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t('vehicles.form.deviceOptional')}
              </label>
              <select
                value={createDeviceId}
                onChange={(e) => setCreateDeviceId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('vehicles.form.noDevice')}</option>
                {devices.filter(d => d.activo).map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.nombre} {device.uniqueId ? `(${device.uniqueId})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">
                {t('vehicles.form.deviceHint')}
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); setCreateDeviceId(''); }} disabled={isCreating}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? t('vehicles.creating') : t('common.create')}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Normal render with data
  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Car size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{vehicles.length}</p>
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
                {vehicles.filter((v) => v.dispositivoActivoId).length}
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
                {vehicles.filter((v) => !v.dispositivoActivoId).length}
              </p>
              <p className="text-sm text-text-muted">{t('vehicles.withoutDevice')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <Table columns={columns} data={vehicles} keyExtractor={(v) => v.id} />
        {/* Controles de paginación */}
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
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('vehicles.createVehicle')}
      >
        <div className="space-y-4">
          <Input
            label={t('vehicles.form.licensePlate')}
            value={createForm.patente}
            onChange={(e) => setCreateForm({ ...createForm, patente: e.target.value })}
            placeholder={t('vehicles.form.licensePlatePlaceholder')}
            error={createErrors.patente}
            required
          />
          <Input
            label={t('vehicles.form.brand')}
            value={createForm.marca || ''}
            onChange={(e) => setCreateForm({ ...createForm, marca: e.target.value })}
            placeholder={t('vehicles.form.brandPlaceholder')}
          />
          <Input
            label={t('vehicles.form.model')}
            value={createForm.modelo || ''}
            onChange={(e) => setCreateForm({ ...createForm, modelo: e.target.value })}
            placeholder={t('vehicles.form.modelPlaceholder')}
          />
          <Input
            label={t('vehicles.form.year')}
            type="number"
            value={createForm.año?.toString() || ''}
            onChange={(e) => setCreateForm({ ...createForm, año: e.target.value ? Number(e.target.value) : undefined })}
            placeholder={t('vehicles.form.yearPlaceholder')}
          />
          
          {/* Organization selector (optional) */}
          <OrganizacionAsociadaSelector
            value={createForm.organizacionAsociadaId}
            onChange={(orgId) => setCreateForm({ ...createForm, organizacionAsociadaId: orgId })}
          />
          
          {/* Device selector (optional) */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('vehicles.form.deviceOptional')}
            </label>
            <select
              value={createDeviceId}
              onChange={(e) => setCreateDeviceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('vehicles.form.noDevice')}</option>
              {devices.filter(d => d.activo).map((device) => (
                <option key={device.id} value={device.id}>
                  {device.nombre} {device.uniqueId ? `(${device.uniqueId})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              {t('vehicles.form.deviceHint')}
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); setCreateDeviceId(''); }} disabled={isCreating}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? t('vehicles.creating') : t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
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
            value={editForm.marca || ''}
            onChange={(e) => setEditForm({ ...editForm, marca: e.target.value })}
            placeholder={t('vehicles.form.brandPlaceholder')}
          />
          <Input
            label={t('vehicles.form.model')}
            value={editForm.modelo || ''}
            onChange={(e) => setEditForm({ ...editForm, modelo: e.target.value })}
            placeholder={t('vehicles.form.modelPlaceholder')}
          />
          <Input
            label={t('vehicles.form.year')}
            type="number"
            value={editForm.año?.toString() || ''}
            onChange={(e) => setEditForm({ ...editForm, año: e.target.value ? Number(e.target.value) : undefined })}
            placeholder={t('vehicles.form.yearPlaceholder')}
          />
          
          {/* Organization selector (optional) */}
          <OrganizacionAsociadaSelector
            value={editForm.organizacionAsociadaId}
            onChange={(orgId) => setEditForm({ ...editForm, organizacionAsociadaId: orgId })}
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
              {t('vehicles.form.active')}
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

      {/* Assign Device Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={vehicleToAssign?.dispositivoActivoId ? t('vehicles.changeDevice') : t('vehicles.assignDevice')}
      >
        <div className="space-y-4">
          {vehicleToAssign && (
            <div className="p-3 bg-background rounded-lg border border-border">
              <p className="text-xs text-text-muted mb-1">{t('vehicles.form.vehicleLabel')}</p>
              <p className="font-medium text-text">
                {vehicleToAssign.patente} - {vehicleToAssign.marca} {vehicleToAssign.modelo}
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('vehicles.form.device')}
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('vehicles.form.noDevice')}</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.nombre} {device.uniqueId ? `(${device.uniqueId})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              {t('vehicles.form.selectDevice')}
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} disabled={isAssigning}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAssignDevice} disabled={isAssigning}>
              {isAssigning ? t('vehicles.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('vehicles.deleteVehicle')}
        description={t('vehicles.confirmDelete', { patente: vehicleToDelete?.patente || '' })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
