import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Plus, Edit, Link2, AlertCircle, Pause, CheckCircle, Eye, Play } from 'lucide-react';
import { Card, Table, Badge, Button, Modal, Input, PaginationControls } from '@/shared/ui';
import { marketplaceApi, vehiculosApi, dispositivosApi } from '@/services/endpoints';
import { usePaginationParams, useLocalization, useErrorHandler } from '@/hooks';
import { useTenantStore } from '@/store';
import { toast } from '@/store/toast.store';
import type {
  VehiculoMarketplaceDto,
  CreateVehiculoMarketplaceRequest,
  VincularVehiculoMarketplaceRequest,
  EditarPublicacionRequest,
  ListaPaginada,
  VehiculoDto,
  DispositivoDto
} from '@/shared/types/api';
import { EstadoPublicacion } from '@/shared/types/api';
import { formatDate } from '@/shared/utils';

export function MarketplacePage() {
  const { t } = useTranslation();
  const { currentOrganization } = useTenantStore();
  const localization = useLocalization();
  const culture = localization.culture;
  const timeZoneId = localization.timeZoneId;
  const { getErrorMessage } = useErrorHandler();

  // Data state
  const [marketplaceData, setMarketplaceData] = useState<ListaPaginada<VehiculoMarketplaceDto> | null>(null);
  const [vehicles, setVehicles] = useState<VehiculoDto[]>([]);
  const [devices, setDevices] = useState<DispositivoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hook de paginación
  const {
    setNumeroPagina,
    setTamanoPagina,
    params: paginationParams
  } = usePaginationParams({ initialPageSize: 10 });

  // Create vehículo en marketplace modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateVehiculoMarketplaceRequest>({
    patente: '',
    marca: '',
    modelo: '',
    anio: undefined,
    precio: undefined,
    moneda: 'ARS',
    kilometraje: 0,
    descripcion: '',
    estado: EstadoPublicacion.Pausado,
    vehiculoId: null, // Opcional: vincular a vehículo existente
  });
  const [createErrors, setCreateErrors] = useState<{ patente?: string }>({});

  type ConfirmStatusChange = {
    item: VehiculoMarketplaceDto;
    estado: EstadoPublicacion;
    titulo: string;
    mensaje: string;
  };

  // Editar/publicar publicaci?n
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingPublication, setIsSavingPublication] = useState(false);
  const [editingItem, setEditingItem] = useState<VehiculoMarketplaceDto | null>(null);
  const [editForm, setEditForm] = useState<EditarPublicacionRequest>({
    precio: null,
    moneda: 'ARS',
    kilometraje: 0,
    descripcion: '',
    estado: EstadoPublicacion.Pausado,
  });
  const [confirmStatusChange, setConfirmStatusChange] = useState<ConfirmStatusChange | null>(null);

  // Preview de publicaci?n
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<VehiculoMarketplaceDto | null>(null);

  // Vincular vehículo modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [vehicleToLink, setVehicleToLink] = useState<VehiculoMarketplaceDto | null>(null);
  const [linkForm, setLinkForm] = useState<VincularVehiculoMarketplaceRequest>({
    vehiculoId: null,
    dispositivoId: null,
    conductorId: null,
    motivoCambio: '',
  });

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await marketplaceApi.getVehiculosMarketplace({
        numeroPagina: paginationParams.numeroPagina,
        tamanoPagina: paginationParams.tamanoPagina,
      });
      setMarketplaceData(data);

      // Cargar vehículos y dispositivos para los selectores
      const [vehiclesData, devicesData] = await Promise.all([
        vehiculosApi.getVehiculos({ numeroPagina: 1, tamanoPagina: 100 }),
        dispositivosApi.getDispositivos({ numeroPagina: 1, tamanoPagina: 100 }),
      ]);
      setVehicles(vehiclesData.items);
      setDevices(devicesData.items);
    } catch (e) {
      const errorMessage = getErrorMessage(e);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [paginationParams.numeroPagina, paginationParams.tamanoPagina, getErrorMessage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ajustar página si es necesario
  useEffect(() => {
    if (
      marketplaceData &&
      marketplaceData.paginaActual > marketplaceData.totalPaginas &&
      marketplaceData.totalPaginas > 0
    ) {
      setNumeroPagina(marketplaceData.totalPaginas);
    }
  }, [marketplaceData, setNumeroPagina]);

  // Create handlers
  const handleCreate = async () => {
    const errors: { patente?: string } = {};
    if (!createForm.patente.trim()) {
      errors.patente = t('marketplace.form.required');
    }
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setIsCreating(true);
    setCreateErrors({});
    try {
      await marketplaceApi.createVehiculoMarketplace({
        ...createForm,
        patente: createForm.patente.trim().toUpperCase(),
        marca: createForm.marca?.trim() || undefined,
        modelo: createForm.modelo?.trim() || undefined,
      });
      toast.success(t('marketplace.success.created'));
      setIsCreateModalOpen(false);
      setCreateForm({
        patente: '',
        marca: '',
        modelo: '',
        anio: undefined,
        precio: undefined,
        moneda: 'ARS',
        kilometraje: 0,
        descripcion: '',
        estado: EstadoPublicacion.Pausado,
        vehiculoId: null,
      });
      await loadData();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsCreating(false);
    }
  };

  // Link handlers
  const handleOpenLink = (vehicle: VehiculoMarketplaceDto) => {
    setVehicleToLink(vehicle);
    setLinkForm({
      vehiculoId: null,
      dispositivoId: null,
      conductorId: null,
      motivoCambio: '',
    });
    setIsLinkModalOpen(true);
  };

  const handleLink = async () => {
    if (!vehicleToLink || !vehicleToLink.publicacionId) return;

    // Validar que al menos uno esté seleccionado
    if (!linkForm.vehiculoId && !linkForm.dispositivoId) {
      toast.error(t('marketplace.form.selectVehicleOrDevice'));
      return;
    }

    setIsLinking(true);
    try {
      await marketplaceApi.vincularVehiculoMarketplace(vehicleToLink.publicacionId, linkForm);
      toast.success(t('marketplace.success.linked'));
      setIsLinkModalOpen(false);
      setVehicleToLink(null);
      await loadData();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsLinking(false);
    }
  };

  const getEstadoLabel = (estado: EstadoPublicacion) => {
    const labels: Record<EstadoPublicacion, string> = {
      [EstadoPublicacion.Borrador]: t('marketplace.status.draft'),
      [EstadoPublicacion.Publicado]: t('marketplace.status.published'),
      [EstadoPublicacion.Pausado]: t('marketplace.status.paused'),
      [EstadoPublicacion.Vendido]: t('marketplace.status.sold'),
    };
    return labels[estado];
  };

  const getEstadosPermitidos = (estadoActual: EstadoPublicacion | null) => {
    if (estadoActual === null) return [EstadoPublicacion.Publicado];

    switch (estadoActual) {
      case EstadoPublicacion.Borrador:
        return [EstadoPublicacion.Borrador, EstadoPublicacion.Publicado, EstadoPublicacion.Pausado];
      case EstadoPublicacion.Publicado:
        return [EstadoPublicacion.Publicado, EstadoPublicacion.Pausado, EstadoPublicacion.Vendido];
      case EstadoPublicacion.Pausado:
        return [EstadoPublicacion.Pausado, EstadoPublicacion.Publicado, EstadoPublicacion.Vendido];
      case EstadoPublicacion.Vendido:
        return [EstadoPublicacion.Vendido];
      default:
        return [EstadoPublicacion.Publicado];
    }
  };

  const buildEditPayloadFromItem = (item: VehiculoMarketplaceDto, estado: EstadoPublicacion): EditarPublicacionRequest => ({
    precio: item.precio ?? null,
    moneda: item.moneda ?? 'ARS',
    kilometraje: item.kilometraje ?? 0,
    descripcion: item.descripcion ?? null,
    estado,
  });

  const handleOpenEdit = (item: VehiculoMarketplaceDto, estadoForzado?: EstadoPublicacion) => {
    setEditingItem(item);
    setEditForm({
      precio: item.precio ?? null,
      moneda: item.moneda ?? 'ARS',
      kilometraje: item.kilometraje ?? 0,
      descripcion: item.descripcion ?? '',
      estado: estadoForzado ?? item.estadoPublicacion ?? EstadoPublicacion.Pausado,
    });
    setIsEditModalOpen(true);
  };

  const handleSavePublication = async () => {
    if (!editingItem) return;

    setIsSavingPublication(true);
    try {
      if (!editingItem.publicacionId) {
        await marketplaceApi.publicarVehiculo(editingItem.vehiculoId, {
          precio: editForm.precio,
          moneda: editForm.moneda ?? 'ARS',
          kilometraje: editForm.kilometraje,
          descripcion: editForm.descripcion ?? null,
        });
        toast.success(t('marketplace.success.published'));
      } else {
        await marketplaceApi.editarPublicacion(editingItem.publicacionId, editForm);
        toast.success(t('marketplace.success.updated'));
      }
      setIsEditModalOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsSavingPublication(false);
    }
  };

  const handleOpenPreview = (item: VehiculoMarketplaceDto) => {
    setPreviewItem(item);
    setIsPreviewModalOpen(true);
  };

  const requestStatusChange = (item: VehiculoMarketplaceDto, estado: EstadoPublicacion) => {
    if (!item.publicacionId) {
      if (estado === EstadoPublicacion.Publicado) {
        handleOpenEdit(item, EstadoPublicacion.Publicado);
        return;
      }
      toast.error(t('marketplace.errors.noPublication'));
      return;
    }

    const titulo = estado === EstadoPublicacion.Pausado
      ? t('marketplace.confirmations.pauseTitle')
      : t('marketplace.confirmations.markAsSoldTitle');
    const mensaje = estado === EstadoPublicacion.Pausado
      ? t('marketplace.confirmations.pauseMessage', { patente: item.patente })
      : t('marketplace.confirmations.markAsSoldMessage', { patente: item.patente });
    setConfirmStatusChange({ item, estado, titulo, mensaje });
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmStatusChange) return;
    setIsSavingPublication(true);
    try {
      await marketplaceApi.editarPublicacion(
        confirmStatusChange.item.publicacionId!,
        buildEditPayloadFromItem(confirmStatusChange.item, confirmStatusChange.estado)
      );
      const successKey = confirmStatusChange.estado === EstadoPublicacion.Pausado
        ? 'marketplace.success.paused'
        : 'marketplace.success.markedAsSold';
      toast.success(t(successKey));
      setConfirmStatusChange(null);
      await loadData();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsSavingPublication(false);
    }
  };

  // Extraer items
  const items = marketplaceData?.items ?? [];

  const estadoOptions = editingItem ? getEstadosPermitidos(editingItem.estadoPublicacion ?? null) : [];
  const isEstadoLocked = editingItem ? !editingItem.publicacionId : false;

  // Helper para estado de publicación
  const getEstadoBadge = (estado: EstadoPublicacion | null) => {
    if (!estado) return <Badge variant="default">{t('marketplace.table.notPublished')}</Badge>;
    const variants: Record<EstadoPublicacion, 'default' | 'success' | 'warning' | 'error'> = {
      [EstadoPublicacion.Borrador]: 'default',
      [EstadoPublicacion.Publicado]: 'success',
      [EstadoPublicacion.Pausado]: 'warning',
      [EstadoPublicacion.Vendido]: 'error',
    };
    return <Badge variant={variants[estado]}>{getEstadoLabel(estado)}</Badge>;
  };

  // Columnas de la tabla
  const columns = [
    { key: 'patente', header: t('marketplace.licensePlate'), sortable: true },
    {
      key: 'vehiculo',
      header: t('marketplace.vehicle'),
      render: (v: VehiculoMarketplaceDto) => {
        const parts = [v.marca, v.modelo, v.anio].filter(Boolean);
        return parts.length > 0 ? parts.join(' ') : '-';
      },
    },
    {
      key: 'estado',
      header: t('marketplace.statusColumn'),
      render: (v: VehiculoMarketplaceDto) => getEstadoBadge(v.estadoPublicacion),
    },
    {
      key: 'precio',
      header: t('marketplace.price'),
      render: (v: VehiculoMarketplaceDto) => {
        if (!v.precio) return <span className="text-text-muted">{t('marketplace.table.consultPrice')}</span>;
        return `${v.moneda || 'ARS'} ${v.precio.toLocaleString(culture)}`;
      },
    },
    {
      key: 'kilometraje',
      header: t('marketplace.mileage'),
      render: (v: VehiculoMarketplaceDto) => `${v.kilometraje.toLocaleString(culture)} km`,
    },
    {
      key: 'fechaPublicacion',
      header: t('marketplace.publicationDate'),
      render: (v: VehiculoMarketplaceDto) =>
        v.fechaPublicacion ? formatDate(v.fechaPublicacion, culture, timeZoneId) : '-',
    },
    {
      key: 'actions',
      header: t('marketplace.actionsColumn'),
      render: (v: VehiculoMarketplaceDto) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenPreview(v)}
            title={t('marketplace.actions.preview')}
          >
            <Eye size={16} />
          </Button>
          {!v.tieneVehiculoAsociado && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenLink(v)}
              title={t('marketplace.linkVehicle')}
            >
              <Link2 size={16} />
            </Button>
          )}
          {(v.estadoPublicacion === EstadoPublicacion.Borrador ||
            v.estadoPublicacion === EstadoPublicacion.Pausado ||
            !v.publicacionId) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(v, EstadoPublicacion.Publicado)}
                title={t('marketplace.actions.publish')}
              >
                <Play size={16} />
              </Button>
            )}
          {v.estadoPublicacion === EstadoPublicacion.Publicado && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => requestStatusChange(v, EstadoPublicacion.Pausado)}
              title={t('marketplace.actions.pause')}
            >
              <Pause size={16} />
            </Button>
          )}
          {(v.estadoPublicacion === EstadoPublicacion.Publicado ||
            v.estadoPublicacion === EstadoPublicacion.Pausado) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => requestStatusChange(v, EstadoPublicacion.Vendido)}
                title={t('marketplace.actions.markAsSold')}
              >
                <CheckCircle size={16} />
              </Button>
            )}
          {v.publicacionId && v.estadoPublicacion !== EstadoPublicacion.Vendido && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(v)}
              title={t('marketplace.editPublication')}
            >
              <Edit size={16} />
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
            <h1 className="text-2xl font-bold text-text">{t('marketplace.title')}</h1>
            <p className="text-text-muted mt-1">{t('marketplace.subtitle')}</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-text-muted mt-4">{t('marketplace.loading')}</p>
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
            <h1 className="text-2xl font-bold text-text">{t('marketplace.title')}</h1>
            <p className="text-text-muted mt-1">{t('marketplace.subtitle')}</p>
          </div>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-error mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{t('marketplace.loadError')}</h3>
            <p className="text-text-muted mb-6 text-center max-w-md">{error}</p>
            <Button onClick={loadData}>{t('marketplace.retry')}</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('marketplace.title')}</h1>
            <p className="text-text-muted mt-1">{t('marketplace.subtitle')}</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            {t('marketplace.addVehicle')}
          </Button>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{t('marketplace.emptyTitle')}</h3>
            <p className="text-text-muted text-center max-w-md mb-4">
              {t('marketplace.emptyDescription')}
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              {t('marketplace.addVehicle')}
            </Button>
          </div>
        </Card>

        {/* Create Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={t('marketplace.addVehicle')}
        >
          <div className="space-y-4">
            {/* Selector de vehículo existente */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t('marketplace.form.linkExistingVehicle')}
              </label>
              <select
                value={createForm.vehiculoId || ''}
                onChange={(e) => {
                  const vehiculoId = e.target.value || null;
                  const vehiculoSeleccionado = vehicles.find(v => v.id === vehiculoId);
                  setCreateForm({
                    ...createForm,
                    vehiculoId,
                    // Si se selecciona un vehículo, pre-llenar datos del vehículo
                    patente: vehiculoSeleccionado ? vehiculoSeleccionado.patente : createForm.patente,
                    marca: vehiculoSeleccionado ? vehiculoSeleccionado.marca : createForm.marca,
                    modelo: vehiculoSeleccionado ? vehiculoSeleccionado.modelo : createForm.modelo,
                    anio: vehiculoSeleccionado ? vehiculoSeleccionado.anio : createForm.anio,
                  });
                }}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('marketplace.form.createNewVehicle')}</option>
                {vehicles
                  .filter(v => v.activo)
                  .map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.patente} - {vehicle.marca} {vehicle.modelo} {vehicle.anio ? `(${vehicle.anio})` : ''}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-text-muted mt-1">
                {t('marketplace.form.linkExistingVehicleHelp')}
              </p>
            </div>

            <Input
              label={t('marketplace.form.licensePlate')}
              value={createForm.patente}
              onChange={(e) => setCreateForm({ ...createForm, patente: e.target.value })}
              placeholder={t('marketplace.form.licensePlatePlaceholder')}
              error={createErrors.patente}
              required={!createForm.vehiculoId}
              disabled={!!createForm.vehiculoId}
            />
            <Input
              label={t('marketplace.form.brand')}
              value={createForm.marca || ''}
              onChange={(e) => setCreateForm({ ...createForm, marca: e.target.value })}
              placeholder={t('marketplace.form.brandPlaceholder')}
              disabled={!!createForm.vehiculoId}
            />
            <Input
              label={t('marketplace.form.model')}
              value={createForm.modelo || ''}
              onChange={(e) => setCreateForm({ ...createForm, modelo: e.target.value })}
              placeholder={t('marketplace.form.modelPlaceholder')}
              disabled={!!createForm.vehiculoId}
            />
            <Input
              label={t('marketplace.form.year')}
              type="number"
              value={createForm.anio?.toString() || ''}
              onChange={(e) => setCreateForm({ ...createForm, anio: e.target.value ? Number(e.target.value) : undefined })}
              placeholder={t('marketplace.form.yearPlaceholder')}
              disabled={!!createForm.vehiculoId}
            />
            <Input
              label={t('marketplace.form.price')}
              type="number"
              value={createForm.precio?.toString() || ''}
              onChange={(e) => setCreateForm({ ...createForm, precio: e.target.value ? Number(e.target.value) : undefined })}
              placeholder={t('marketplace.form.pricePlaceholder')}
            />
            <Input
              label={t('marketplace.form.mileage')}
              type="number"
              value={(createForm.kilometraje ?? 0).toString()}
              onChange={(e) => setCreateForm({ ...createForm, kilometraje: Number(e.target.value) || 0 })}
              placeholder={t('marketplace.form.mileagePlaceholder')}
            />
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t('marketplace.form.description')}
              </label>
              <textarea
                value={createForm.descripcion || ''}
                onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
                placeholder={t('marketplace.form.descriptionPlaceholder')}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? t('marketplace.creating') : t('common.save')}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Main content
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('marketplace.title')}</h1>
          <p className="text-text-muted mt-1">{t('marketplace.subtitle')}</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          {t('marketplace.addVehicle')}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">{t('marketplace.stats.published')}</p>
                <p className="text-2xl font-bold text-text">
                  {items.filter(v => v.estadoPublicacion === EstadoPublicacion.Publicado).length}
                </p>
              </div>
              <CheckCircle size={24} className="text-success" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">{t('marketplace.stats.drafts')}</p>
                <p className="text-2xl font-bold text-text">
                  {items.filter(v => v.estadoPublicacion === EstadoPublicacion.Borrador).length}
                </p>
              </div>
              <Edit size={24} className="text-text-muted" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">{t('marketplace.stats.paused')}</p>
                <p className="text-2xl font-bold text-text">
                  {items.filter(v => v.estadoPublicacion === EstadoPublicacion.Pausado).length}
                </p>
              </div>
              <Pause size={24} className="text-warning" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">{t('marketplace.stats.sold')}</p>
                <p className="text-2xl font-bold text-text">
                  {items.filter(v => v.estadoPublicacion === EstadoPublicacion.Vendido).length}
                </p>
              </div>
              <CheckCircle size={24} className="text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table
          data={items}
          columns={columns}
          keyExtractor={(v) => v.publicacionId || v.vehiculoId}
          emptyMessage={t('marketplace.noPublications')}
        />
      </Card>

      {/* Pagination */}
      {marketplaceData && (
        <PaginationControls
          paginaActual={marketplaceData.paginaActual}
          totalPaginas={marketplaceData.totalPaginas}
          totalRegistros={marketplaceData.totalRegistros}
          tamanoPagina={marketplaceData.tamanoPagina}
          onPageChange={setNumeroPagina}
          onPageSizeChange={setTamanoPagina}
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('marketplace.addVehicle')}
      >
        <div className="space-y-4">
          <Input
            label={t('marketplace.form.licensePlate')}
            value={createForm.patente}
            onChange={(e) => setCreateForm({ ...createForm, patente: e.target.value })}
            placeholder={t('marketplace.form.licensePlatePlaceholder')}
            error={createErrors.patente}
            required
          />
          <Input
            label={t('marketplace.form.brand')}
            value={createForm.marca || ''}
            onChange={(e) => setCreateForm({ ...createForm, marca: e.target.value })}
            placeholder={t('marketplace.form.brandPlaceholder')}
          />
          <Input
            label={t('marketplace.form.model')}
            value={createForm.modelo || ''}
            onChange={(e) => setCreateForm({ ...createForm, modelo: e.target.value })}
            placeholder={t('marketplace.form.modelPlaceholder')}
          />
          <Input
            label={t('marketplace.form.year')}
            type="number"
            value={createForm.anio?.toString() || ''}
            onChange={(e) => setCreateForm({ ...createForm, anio: e.target.value ? Number(e.target.value) : undefined })}
            placeholder={t('marketplace.form.yearPlaceholder')}
          />
          <Input
            label={t('marketplace.form.price')}
            type="number"
            value={createForm.precio?.toString() || ''}
            onChange={(e) => setCreateForm({ ...createForm, precio: e.target.value ? Number(e.target.value) : undefined })}
            placeholder={t('marketplace.form.pricePlaceholder')}
          />
          <Input
            label={t('marketplace.form.mileage')}
            type="number"
            value={(createForm.kilometraje ?? 0).toString()}
            onChange={(e) => setCreateForm({ ...createForm, kilometraje: Number(e.target.value) || 0 })}
            placeholder={t('marketplace.form.mileagePlaceholder')}
          />
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('marketplace.form.description')}
            </label>
            <textarea
              value={createForm.descripcion || ''}
              onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
              placeholder={t('marketplace.form.descriptionPlaceholder')}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? t('marketplace.creating') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit/Publish Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingItem?.publicacionId ? t('marketplace.editPublication') : t('marketplace.publishVehicle')}
      >
        {editingItem && (
          <div className="space-y-4">
            <div className="p-3 bg-background rounded-lg border border-border">
              <p className="text-xs text-text-muted mb-1">{t('marketplace.form.vehicleToLink')}</p>
              <p className="font-medium text-text">
                {editingItem.patente} - {editingItem.marca} {editingItem.modelo}
              </p>
            </div>

            <Input
              label={t('marketplace.form.price')}
              type="number"
              value={editForm.precio?.toString() || ''}
              onChange={(e) => setEditForm({ ...editForm, precio: e.target.value ? Number(e.target.value) : null })}
              placeholder={t('marketplace.form.pricePlaceholder')}
              helperText={t('marketplace.form.priceHelper')}
            />
            <Input
              label={t('marketplace.form.mileage')}
              type="number"
              value={editForm.kilometraje.toString()}
              onChange={(e) => setEditForm({ ...editForm, kilometraje: Number(e.target.value) || 0 })}
              placeholder={t('marketplace.form.mileagePlaceholder')}
            />
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t('marketplace.form.description')}
              </label>
              <textarea
                value={editForm.descripcion || ''}
                onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                placeholder={t('marketplace.form.descriptionPlaceholder')}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                {t('marketplace.form.publicationStatus')}
              </label>
              <select
                value={editForm.estado}
                onChange={(e) => setEditForm({ ...editForm, estado: Number(e.target.value) as EstadoPublicacion })}
                disabled={isEstadoLocked}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                {estadoOptions.map((estado) => (
                  <option key={estado} value={estado}>
                    {getEstadoLabel(estado)}
                  </option>
                ))}
              </select>
              {isEstadoLocked && (
                <p className="text-xs text-text-muted mt-1">
                  {t('marketplace.form.estadoLocked')}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSavingPublication}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSavePublication} disabled={isSavingPublication}>
                {isSavingPublication ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={t('marketplace.preview.title')}
      >
        {previewItem && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg border border-border bg-background">
              <p className="text-xs text-text-muted mb-3">{t('marketplace.preview.listing')}</p>
              <div className="flex gap-4">
                <div className="w-24 h-20 rounded-md bg-surface border border-border flex items-center justify-center text-text-muted text-xs">
                  {t('marketplace.preview.photoPlaceholder')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text">
                      {[previewItem.marca, previewItem.modelo].filter(Boolean).join(' ') || t('marketplace.preview.vehicleFallback')}
                    </h3>
                    {previewItem.estadoPublicacion && (
                      <Badge variant="default">{getEstadoLabel(previewItem.estadoPublicacion)}</Badge>
                    )}
                  </div>
                  <p className="text-text-muted text-sm mt-1">{previewItem.patente}</p>
                  <p className="text-text mt-2">
                    {previewItem.precio
                      ? `${previewItem.moneda || 'ARS'} ${previewItem.precio.toLocaleString(culture)}`
                      : t('marketplace.table.consultPrice')}
                  </p>
                  <p className="text-text-muted text-sm">
                    {previewItem.kilometraje.toLocaleString(culture)} km
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background">
              <p className="text-xs text-text-muted mb-3">{t('marketplace.preview.detail')}</p>
              <p className="text-text mb-2">
                {previewItem.descripcion || t('marketplace.preview.noDescription')}
              </p>
              <div className="text-sm text-text-muted space-y-1">
                <p>{t('marketplace.preview.seller')}: {currentOrganization?.name || t('marketplace.preview.sellerFallback')}</p>
                <p>{t('marketplace.preview.year')}: {previewItem.anio || '-'}</p>
                <p>{t('marketplace.preview.status')}: {previewItem.estadoPublicacion ? getEstadoLabel(previewItem.estadoPublicacion) : t('marketplace.table.notPublished')}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Status Modal */}
      <Modal
        isOpen={!!confirmStatusChange}
        onClose={() => setConfirmStatusChange(null)}
        title={confirmStatusChange?.titulo || ''}
      >
        <div className="space-y-4">
          <p className="text-text">{confirmStatusChange?.mensaje}</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setConfirmStatusChange(null)} disabled={isSavingPublication}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirmStatusChange} disabled={isSavingPublication}>
              {isSavingPublication ? t('common.saving') : t('common.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Link Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title={t('marketplace.linkVehicle')}
      >
        <div className="space-y-4">
          {vehicleToLink && (
            <div className="p-3 bg-background rounded-lg border border-border">
              <p className="text-xs text-text-muted mb-1">{t('marketplace.form.vehicleToLink')}</p>
              <p className="font-medium text-text">
                {vehicleToLink.patente} - {vehicleToLink.marca} {vehicleToLink.modelo}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('marketplace.form.existingVehicle')}
            </label>
            <select
              value={linkForm.vehiculoId || ''}
              onChange={(e) => setLinkForm({ ...linkForm, vehiculoId: e.target.value || null })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('marketplace.form.noVehicle')}</option>
              {vehicles.filter(v => v.activo).map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.patente} - {vehicle.marca} {vehicle.modelo}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              {t('marketplace.form.selectExistingVehicle')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('marketplace.form.device')}
            </label>
            <select
              value={linkForm.dispositivoId || ''}
              onChange={(e) => setLinkForm({ ...linkForm, dispositivoId: e.target.value || null })}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('marketplace.form.noDevice')}</option>
              {devices.filter(d => d.activo).map((device) => (
                <option key={device.id} value={device.id}>
                  {device.nombre} {device.uniqueId ? `(${device.uniqueId})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              {t('marketplace.form.selectDeviceToCreateVehicle')}
            </p>
          </div>

          <Input
            label={t('marketplace.form.reason')}
            value={linkForm.motivoCambio || ''}
            onChange={(e) => setLinkForm({ ...linkForm, motivoCambio: e.target.value })}
            placeholder={t('marketplace.form.reasonPlaceholder')}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)} disabled={isLinking}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleLink} disabled={isLinking}>
              {isLinking ? t('marketplace.linking') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}