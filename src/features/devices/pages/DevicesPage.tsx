import { useCallback, useEffect, useState } from 'react';
import { Wifi, WifiOff, Settings, AlertCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, Table, Badge, Button, Modal, Input, ConfirmationModal } from '@/shared/ui';
import { dispositivosApi } from '@/services/endpoints';
import { usePermissions } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { DispositivoDto } from '@/shared/types/api';

export function DevicesPage() {
  const [devices, setDevices] = useState<DispositivoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    traccarDeviceId: '',
    alias: '',
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
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<DispositivoDto | null>(null);
  const { can } = usePermissions();

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (import.meta.env.DEV) {
        console.log('[DevicesPage] Loading devices...');
      }
      const data = await dispositivosApi.getDispositivos();
      setDevices(data);
      if (import.meta.env.DEV) {
        console.log('[DevicesPage] Devices loaded:', data);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo cargar la lista de dispositivos';
      setError(msg);
      if (import.meta.env.DEV) {
        console.error('[DevicesPage] Error loading devices:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar dispositivos al montar el componente
  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  // Permisos
  const canConfigure = can('dispositivos:configurar');
  const canCreate = can('dispositivos:configurar'); // Usar mismo permiso que configurar

  const handleCreateDevice = async () => {
    // Validar formulario
    const errors: { traccarDeviceId?: string } = {};
    const traccarDeviceIdNum = Number(createForm.traccarDeviceId);
    
    if (!createForm.traccarDeviceId || isNaN(traccarDeviceIdNum) || traccarDeviceIdNum <= 0) {
      errors.traccarDeviceId = 'El ID de Traccar debe ser un número mayor a 0';
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
        createForm.alias.trim() || undefined
      );
      
      toast.success('Dispositivo creado correctamente');
      setIsCreateModalOpen(false);
      setCreateForm({ traccarDeviceId: '', alias: '' });
      
      // Refetch lista
      await loadDevices();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo crear el dispositivo';
      toast.error(msg);
      if (import.meta.env.DEV) {
        console.error('[DevicesPage] Error creating device:', e);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (device: DispositivoDto) => {
    setEditingDevice(device);
    setEditForm({
      alias: device.nombre, // El nombre puede ser el alias o "Dispositivo {id}"
      activo: device.activo,
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
        editForm.activo
      );
      
      toast.success('Dispositivo actualizado correctamente');
      setIsEditModalOpen(false);
      setEditingDevice(null);
      
      // Refetch lista
      await loadDevices();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo actualizar el dispositivo';
      toast.error(msg);
      if (import.meta.env.DEV) {
        console.error('[DevicesPage] Error updating device:', e);
      }
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
      
      toast.success('Dispositivo eliminado correctamente');
      setIsDeleteModalOpen(false);
      setDeviceToDelete(null);
      
      // Refetch lista
      await loadDevices();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar el dispositivo';
      toast.error(msg);
      if (import.meta.env.DEV) {
        console.error('[DevicesPage] Error deleting device:', e);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstadoBadge = (estado: string | null) => {
    if (!estado) return <Badge variant="info">Desconocido</Badge>;
    switch (estado) {
      case 'online': return <Badge variant="success">Online</Badge>;
      case 'offline': return <Badge variant="error">Offline</Badge>;
      default: return <Badge variant="info">{estado}</Badge>;
    }
  };

  const columns = [
    { key: 'nombre', header: 'Nombre', sortable: true },
    {
      key: 'estado',
      header: 'Estado',
      render: (d: DispositivoDto) => getEstadoBadge(d.estado)
    },
    {
      key: 'ultimaActualizacionUtc',
      header: 'Última actualización',
      render: (d: DispositivoDto) => formatDate(d.ultimaActualizacionUtc)
    },
    {
      key: 'activo',
      header: 'Activo',
      render: (d: DispositivoDto) => (
        d.activo ? <Badge variant="success">Sí</Badge> : <Badge variant="error">No</Badge>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (d: DispositivoDto) => {
        // Sin permiso de configurar, no mostrar acciones
        if (!canConfigure) return null;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(d)}
              title="Editar dispositivo"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDelete(d)}
              title="Eliminar dispositivo"
            >
              <Trash2 size={16} className="text-error" />
            </Button>
          </div>
        );
      }
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Dispositivos</h1>
            <p className="text-text-muted mt-1">Gestión de dispositivos telemáticos</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-text-muted mt-4">Cargando dispositivos...</p>
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
            <h1 className="text-2xl font-bold text-text">Dispositivos</h1>
            <p className="text-text-muted mt-1">Gestión de dispositivos telemáticos</p>
          </div>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-error mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Error al cargar dispositivos</h3>
            <p className="text-text-muted mb-6 text-center max-w-md">{error}</p>
            <Button onClick={loadDevices}>Reintentar</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Empty state
  if (devices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Dispositivos</h1>
            <p className="text-text-muted mt-1">Gestión de dispositivos telemáticos</p>
          </div>
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              Agregar Dispositivo
            </Button>
          )}
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Settings size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Sin dispositivos</h3>
            <p className="text-text-muted text-center max-w-md mb-4">
              No hay dispositivos registrados para tu organización.
            </p>
            {canCreate && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                Agregar Dispositivo
              </Button>
            )}
          </div>
        </Card>

        {/* Modal de creación */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreateForm({ traccarDeviceId: '', alias: '' });
            setCreateErrors({});
          }}
          title="Agregar Dispositivo"
        >
          <div className="space-y-4">
            <Input
              label="ID de Traccar"
              type="number"
              value={createForm.traccarDeviceId}
              onChange={(e) => setCreateForm({ ...createForm, traccarDeviceId: e.target.value })}
              placeholder="12345"
              error={createErrors.traccarDeviceId}
              helperText="ID numérico del dispositivo en Traccar"
              required
            />
            <Input
              label="Alias (opcional)"
              type="text"
              value={createForm.alias}
              onChange={(e) => setCreateForm({ ...createForm, alias: e.target.value })}
              placeholder="GPS Vehículo 1"
              helperText="Nombre descriptivo para mostrar en TracAuto"
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateForm({ traccarDeviceId: '', alias: '' });
                  setCreateErrors({});
                }}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateDevice} disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Dispositivos</h1>
          <p className="text-text-muted mt-1">Gestión de dispositivos telemáticos</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Agregar Dispositivo
          </Button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <Wifi size={24} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {devices.filter(d => d.estado === 'online').length}
              </p>
              <p className="text-sm text-text-muted">Dispositivos Online</p>
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
                {devices.filter(d => d.estado === 'offline').length}
              </p>
              <p className="text-sm text-text-muted">Dispositivos Offline</p>
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
                {devices.filter(d => d.estado !== 'online' && d.estado !== 'offline').length}
              </p>
              <p className="text-sm text-text-muted">Disponibles</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={devices}
          keyExtractor={(d) => d.id}
        />
      </Card>

      {/* Modal de creación */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateForm({ traccarDeviceId: '', alias: '' });
          setCreateErrors({});
        }}
        title="Agregar Dispositivo"
      >
        <div className="space-y-4">
          <Input
            label="ID de Traccar"
            type="number"
            value={createForm.traccarDeviceId}
            onChange={(e) => setCreateForm({ ...createForm, traccarDeviceId: e.target.value })}
            placeholder="12345"
            error={createErrors.traccarDeviceId}
            helperText="ID numérico del dispositivo en Traccar"
            required
          />
          <Input
            label="Alias (opcional)"
            type="text"
            value={createForm.alias}
            onChange={(e) => setCreateForm({ ...createForm, alias: e.target.value })}
            placeholder="GPS Vehículo 1"
            helperText="Nombre descriptivo para mostrar en TracAuto"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setCreateForm({ traccarDeviceId: '', alias: '' });
                setCreateErrors({});
              }}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateDevice} disabled={isCreating}>
              {isCreating ? 'Creando...' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de edición */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDevice(null);
        }}
        title="Editar Dispositivo"
      >
        <div className="space-y-4">
          <Input
            label="Alias"
            type="text"
            value={editForm.alias}
            onChange={(e) => setEditForm({ ...editForm, alias: e.target.value })}
            placeholder="GPS Vehículo 1"
            helperText="Nombre descriptivo para mostrar en TracAuto"
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
              Dispositivo activo
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
              Cancelar
            </Button>
            <Button onClick={handleUpdateDevice} disabled={isUpdating}>
              {isUpdating ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeviceToDelete(null);
        }}
        onConfirm={handleDeleteDevice}
        title="Eliminar Dispositivo"
        description={`¿Está seguro de eliminar el dispositivo "${deviceToDelete?.nombre}"? Esta acción marcará el dispositivo como inactivo.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
