import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, Settings, AlertCircle, Plus, Edit, Trash2, Share2 } from 'lucide-react';
import { Card, Table, Badge, Button, Modal, Input, ConfirmationModal, PaginationControls } from '@/shared/ui';
import { dispositivosApi } from '@/services/endpoints';
import { usePermissions, usePaginationParams, useLocalization, useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { DispositivoDto, ListaPaginada, TipoRecurso } from '@/shared/types/api';
import { NivelPermisoCompartido } from '@/shared/types/api';
import { formatDateTime } from '@/shared/utils';
import { GestionarComparticionModal } from '@/features/organization';

export function DevicesPage() {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();
  const { getErrorMessage } = useErrorHandler();
  // Datos paginados
  const [devicesData, setDevicesData] = useState<ListaPaginada<DispositivoDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hook de paginaciรณn reutilizable
  const {
    setNumeroPagina,
    setTamanoPagina,
    params: paginationParams
  } = usePaginationParams({ initialPageSize: 10 });
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

  // Sharing modal
  const [deviceToShare, setDeviceToShare] = useState<DispositivoDto | null>(null);

  const { can } = usePermissions();

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (import.meta.env.DEV) {
        console.log('[DevicesPage] Loading devices...');
      }
      const result = await dispositivosApi.getDispositivos(paginationParams);
      setDevicesData(result);
      if (import.meta.env.DEV) {
        console.log('[DevicesPage] Devices loaded:', result.items, 'Total:', result.totalRegistros);
      }
    } catch (e) {
      setError(getErrorMessage(e));
      if (import.meta.env.DEV) {
        console.error('[DevicesPage] Error loading devices:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }, [paginationParams]);

  // Extraer items para compatibilidad
  const devices = devicesData?.items ?? [];

  // Cargar dispositivos al montar el componente
  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  // Ajustar automรกticamente si la pรกgina actual excede el total de pรกginas
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
        createForm.alias.trim() || undefined
      );

      toast.success(t('devices.success.created'));
      setIsCreateModalOpen(false);
      setCreateForm({ traccarDeviceId: '', alias: '' });

      // Refetch lista
      await loadDevices();
    } catch (e) {
      toast.error(getErrorMessage(e));
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

      toast.success(t('devices.success.updated'));
      setIsEditModalOpen(false);
      setEditingDevice(null);

      // Refetch lista
      await loadDevices();
    } catch (e) {
      toast.error(getErrorMessage(e));
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

      toast.success(t('devices.success.deleted'));
      setIsDeleteModalOpen(false);
      setDeviceToDelete(null);

      // Refetch lista
      await loadDevices();
    } catch (e) {
      toast.error(getErrorMessage(e));
      if (import.meta.env.DEV) {
        console.error('[DevicesPage] Error deleting device:', e);
      }
    } finally {
      setIsDeleting(false);
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
        // Si está compartido con otras organizaciones
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
            —
          </button>
        );
      },
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
            {/* Botón de compartición - solo para recursos propios */}
            {!d.esRecursoAsociado && (
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('devices.title')}</h1>
            <p className="text-text-muted mt-1">{t('devices.subtitle')}</p>
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
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('devices.title')}</h1>
            <p className="text-text-muted mt-1">{t('devices.subtitle')}</p>
          </div>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-error mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{t('devices.loadError')}</h3>
            <p className="text-text-muted mb-6 text-center max-w-md">{error}</p>
            <Button onClick={loadDevices}>{t('devices.retry')}</Button>
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
            <h1 className="text-2xl font-bold text-text">{t('devices.title')}</h1>
            <p className="text-text-muted mt-1">{t('devices.subtitle')}</p>
          </div>
          {canCreate && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              {t('devices.createDevice')}
            </Button>
          )}
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Settings size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{t('devices.emptyTitle')}</h3>
            <p className="text-text-muted text-center max-w-md mb-4">
              {t('devices.emptyDescription')}
            </p>
            {canCreate && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                {t('devices.createDevice')}
              </Button>
            )}
          </div>
        </Card>

        {/* Modal de creaciรณn */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreateForm({ traccarDeviceId: '', alias: '' });
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
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreateDevice} disabled={isCreating}>
                {isCreating ? t('devices.creating') : t('common.create')}
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
          <h1 className="text-2xl font-bold text-text">{t('devices.title')}</h1>
          <p className="text-text-muted mt-1">{t('devices.subtitle')}</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            {t('devices.createDevice')}
          </Button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Settings size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">{devices.length}</p>
              <p className="text-sm text-text-muted">{t('devices.totalDevices')}</p>
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
              <p className="text-sm text-text-muted">{t('devices.devicesOnline')}</p>
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
              <p className="text-sm text-text-muted">{t('devices.devicesOffline')}</p>
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
      <Card padding="none">
        <Table
          columns={columns}
          data={devices}
          keyExtractor={(d) => d.id}
        />
        {/* Controles de paginaciรณn */}
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

      {/* Modal de creaciรณn */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateForm({ traccarDeviceId: '', alias: '' });
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateDevice} disabled={isCreating}>
              {isCreating ? t('devices.creating') : t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de ediciรณn */}
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

      {/* Modal de confirmación de eliminación */}
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

      {/* Modal de Gestión de Compartición */}
      {deviceToShare && (
        <GestionarComparticionModal
          isOpen={!!deviceToShare}
          onClose={() => setDeviceToShare(null)}
          resourceId={deviceToShare.id}
          resourceType={3 as TipoRecurso} // TipoRecurso.DispositivoTraccar
          resourceName={deviceToShare.nombre}
          onSuccess={loadDevices}
        />
      )}
    </div>
  );
}
