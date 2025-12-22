import { useCallback, useEffect, useState } from 'react';
import { Car, Plus, Edit, Trash2, AlertCircle, Link, Unlink } from 'lucide-react';
import { Card, Table, Badge, Button, Modal, Input, ConfirmationModal } from '@/shared/ui';
import { vehiculosApi, dispositivosApi } from '@/services/endpoints';
import { usePermissions } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { VehiculoDto, CreateVehiculoRequest, TipoVehiculo } from '../types';
import type { DispositivoDto } from '@/shared/types/api';

export function VehiclesPage() {
  // Data state
  const [vehicles, setVehicles] = useState<VehiculoDto[]>([]);
  const [devices, setDevices] = useState<DispositivoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateVehiculoRequest>({
    tipo: 1, // Auto
    patente: '',
    marca: '',
    modelo: '',
    año: undefined,
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

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehiculosData, devicesData] = await Promise.all([
        vehiculosApi.getVehiculos(),
        dispositivosApi.getDispositivos(),
      ]);
      setVehicles(vehiculosData);
      setDevices(devicesData);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo cargar los datos';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Create handlers
  const handleCreate = async () => {
    const errors: { patente?: string } = {};
    if (!createForm.patente.trim()) {
      errors.patente = 'La patente es requerida';
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
      });
      
      // 2. If device selected, assign it
      if (createDeviceId) {
        try {
          await vehiculosApi.assignDispositivo(newVehicle.id, {
            dispositivoId: createDeviceId,
          });
          toast.success('Vehículo creado y dispositivo asignado');
        } catch (assignError) {
          // Vehicle created but assignment failed
          const assignMsg = assignError instanceof Error ? assignError.message : 'Error al asignar dispositivo';
          toast.warning(`Vehículo creado pero: ${assignMsg}`);
        }
      } else {
        toast.success('Vehículo creado correctamente');
      }
      
      setIsCreateModalOpen(false);
      setCreateForm({ tipo: 1, patente: '', marca: '', modelo: '', año: undefined });
      setCreateDeviceId('');
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo crear el vehículo';
      toast.error(msg);
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
      });
      toast.success('Vehículo actualizado correctamente');
      setIsEditModalOpen(false);
      setEditingVehicle(null);
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo actualizar el vehículo';
      toast.error(msg);
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
      toast.success('Vehículo eliminado correctamente');
      setIsDeleteModalOpen(false);
      setVehicleToDelete(null);
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar el vehículo';
      toast.error(msg);
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
        toast.success('Dispositivo asignado correctamente');
      } else if (currentDeviceId) {
        // Unassign current device
        await vehiculosApi.unassignDispositivo(
          vehicleToAssign.id,
          currentDeviceId
        );
        toast.success('Dispositivo desasignado correctamente');
      }
      setIsAssignModalOpen(false);
      setVehicleToAssign(null);
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo asignar el dispositivo';
      toast.error(msg);
    } finally {
      setIsAssigning(false);
    }
  };

  // Table helpers
  const getDeviceName = (deviceId: string | null) => {
    if (!deviceId) return null;
    const device = devices.find(d => d.id === deviceId);
    return device?.nombre || device?.uniqueId || 'Dispositivo';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const columns = [
    { key: 'patente', header: 'Patente', sortable: true },
    {
      key: 'vehiculo',
      header: 'Vehículo',
      render: (v: VehiculoDto) => {
        const parts = [v.marca, v.modelo, v.año].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : '-';
      },
    },
    {
      key: 'dispositivo',
      header: 'Dispositivo',
      render: (v: VehiculoDto) => {
        const deviceName = getDeviceName(v.dispositivoActivoId);
        return deviceName ? (
          <Badge variant="info">{deviceName}</Badge>
        ) : (
          <span className="text-text-muted">Sin asignar</span>
        );
      },
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (v: VehiculoDto) => (
        <Badge variant={v.activo ? 'success' : 'error'}>
          {v.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'fechaCreacion',
      header: 'Creado',
      render: (v: VehiculoDto) => formatDate(v.fechaCreacion),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (v: VehiculoDto) => (
        <div className="flex items-center gap-1">
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenAssign(v)}
                title={v.dispositivoActivoId ? 'Cambiar dispositivo' : 'Asignar dispositivo'}
              >
                {v.dispositivoActivoId ? <Unlink size={16} /> : <Link size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(v)}
                title="Editar vehículo"
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
              title="Eliminar vehículo"
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
            <h1 className="text-2xl font-bold text-text">Vehículos</h1>
            <p className="text-text-muted mt-1">Gestión de vehículos de la organización</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-text-muted mt-4">Cargando vehículos...</p>
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
            <h1 className="text-2xl font-bold text-text">Vehículos</h1>
            <p className="text-text-muted mt-1">Gestión de vehículos de la organización</p>
          </div>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-error mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Error al cargar vehículos</h3>
            <p className="text-text-muted mb-6 text-center max-w-md">{error}</p>
            <Button onClick={loadData}>Reintentar</Button>
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
            <h1 className="text-2xl font-bold text-text">Vehículos</h1>
            <p className="text-text-muted mt-1">Gestión de vehículos de la organización</p>
          </div>
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              Agregar Vehículo
            </Button>
          )}
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Car size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Sin vehículos</h3>
            <p className="text-text-muted text-center max-w-md mb-4">
              No hay vehículos registrados para tu organización.
            </p>
            {canCreate && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                Agregar Vehículo
              </Button>
            )}
          </div>
        </Card>

        {/* Create Modal (needed even for empty state) */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Agregar Vehículo"
        >
          <div className="space-y-4">
            <Input
              label="Patente"
              value={createForm.patente}
              onChange={(e) => setCreateForm({ ...createForm, patente: e.target.value })}
              placeholder="ABC123"
              error={createErrors.patente}
              required
            />
            <Input
              label="Marca"
              value={createForm.marca || ''}
              onChange={(e) => setCreateForm({ ...createForm, marca: e.target.value })}
              placeholder="Ford"
            />
            <Input
              label="Modelo"
              value={createForm.modelo || ''}
              onChange={(e) => setCreateForm({ ...createForm, modelo: e.target.value })}
              placeholder="Ranger"
            />
            <Input
              label="Año"
              type="number"
              value={createForm.año?.toString() || ''}
              onChange={(e) => setCreateForm({ ...createForm, año: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="2024"
            />
            
            {/* Device selector (optional) */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Dispositivo GPS (opcional)
              </label>
              <select
                value={createDeviceId}
                onChange={(e) => setCreateDeviceId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Sin dispositivo</option>
                {devices.filter(d => d.activo).map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.nombre} {device.uniqueId ? `(${device.uniqueId})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1">
                Podés asignar el dispositivo ahora o después
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); setCreateDeviceId(''); }} disabled={isCreating}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear'}
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
          <h1 className="text-2xl font-bold text-text">Vehículos</h1>
          <p className="text-text-muted mt-1">Gestión de vehículos de la organización</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Agregar Vehículo
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
              <p className="text-sm text-text-muted">Total Vehículos</p>
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
              <p className="text-sm text-text-muted">Con Dispositivo</p>
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
              <p className="text-sm text-text-muted">Sin Dispositivo</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <Table columns={columns} data={vehicles} keyExtractor={(v) => v.id} />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Agregar Vehículo"
      >
        <div className="space-y-4">
          <Input
            label="Patente"
            value={createForm.patente}
            onChange={(e) => setCreateForm({ ...createForm, patente: e.target.value })}
            placeholder="ABC123"
            error={createErrors.patente}
            required
          />
          <Input
            label="Marca"
            value={createForm.marca || ''}
            onChange={(e) => setCreateForm({ ...createForm, marca: e.target.value })}
            placeholder="Ford"
          />
          <Input
            label="Modelo"
            value={createForm.modelo || ''}
            onChange={(e) => setCreateForm({ ...createForm, modelo: e.target.value })}
            placeholder="Ranger"
          />
          <Input
            label="Año"
            type="number"
            value={createForm.año?.toString() || ''}
            onChange={(e) => setCreateForm({ ...createForm, año: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="2024"
          />
          
          {/* Device selector (optional) */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Dispositivo GPS (opcional)
            </label>
            <select
              value={createDeviceId}
              onChange={(e) => setCreateDeviceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sin dispositivo</option>
              {devices.filter(d => d.activo).map((device) => (
                <option key={device.id} value={device.id}>
                  {device.nombre} {device.uniqueId ? `(${device.uniqueId})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              Podés asignar el dispositivo ahora o después
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); setCreateDeviceId(''); }} disabled={isCreating}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Vehículo"
      >
        <div className="space-y-4">
          <Input
            label="Patente"
            value={editForm.patente}
            onChange={(e) => setEditForm({ ...editForm, patente: e.target.value })}
            placeholder="ABC123"
            required
          />
          <Input
            label="Marca"
            value={editForm.marca || ''}
            onChange={(e) => setEditForm({ ...editForm, marca: e.target.value })}
            placeholder="Ford"
          />
          <Input
            label="Modelo"
            value={editForm.modelo || ''}
            onChange={(e) => setEditForm({ ...editForm, modelo: e.target.value })}
            placeholder="Ranger"
          />
          <Input
            label="Año"
            type="number"
            value={editForm.año?.toString() || ''}
            onChange={(e) => setEditForm({ ...editForm, año: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="2024"
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
              Vehículo activo
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Device Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={vehicleToAssign?.dispositivoActivoId ? 'Cambiar Dispositivo' : 'Asignar Dispositivo'}
      >
        <div className="space-y-4">
          {vehicleToAssign && (
            <div className="p-3 bg-background rounded-lg border border-border">
              <p className="text-xs text-text-muted mb-1">Vehículo</p>
              <p className="font-medium text-text">
                {vehicleToAssign.patente} - {vehicleToAssign.marca} {vehicleToAssign.modelo}
              </p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Dispositivo
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sin dispositivo</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.nombre} {device.uniqueId ? `(${device.uniqueId})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              Selecciona el dispositivo GPS a vincular con este vehículo
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)} disabled={isAssigning}>
              Cancelar
            </Button>
            <Button onClick={handleAssignDevice} disabled={isAssigning}>
              {isAssigning ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Vehículo"
        description={`¿Está seguro de eliminar el vehículo "${vehicleToDelete?.patente}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
