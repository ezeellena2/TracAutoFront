import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Plus, Edit, Link2, AlertCircle, Pause, CheckCircle } from 'lucide-react';
import { Card, Table, Badge, Button, Modal, Input, PaginationControls } from '@/shared/ui';
import { marketplaceApi, vehiculosApi, dispositivosApi } from '@/services/endpoints';
import { usePaginationParams, useLocalization, useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type {
  VehiculoMarketplaceDto,
  CreateVehiculoMarketplaceRequest,
  VincularVehiculoMarketplaceRequest,
  ListaPaginada,
  VehiculoDto,
  DispositivoDto
} from '@/shared/types/api';
import { EstadoPublicacion } from '@/shared/types/api';
import { formatDate } from '@/shared/utils';

export function MarketplacePage() {
  const { t } = useTranslation();
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

  // Extraer items
  const items = marketplaceData?.items ?? [];

  // Helper para estado de publicación
  const getEstadoBadge = (estado: EstadoPublicacion | null) => {
    if (!estado) return null;
    const variants: Record<EstadoPublicacion, 'default' | 'success' | 'warning' | 'error'> = {
      [EstadoPublicacion.Borrador]: 'default',
      [EstadoPublicacion.Publicado]: 'success',
      [EstadoPublicacion.Pausado]: 'warning',
      [EstadoPublicacion.Vendido]: 'error',
    };
    const labels: Record<EstadoPublicacion, string> = {
      [EstadoPublicacion.Borrador]: t('marketplace.status.draft'),
      [EstadoPublicacion.Publicado]: t('marketplace.status.published'),
      [EstadoPublicacion.Pausado]: t('marketplace.status.paused'),
      [EstadoPublicacion.Vendido]: t('marketplace.status.sold'),
    };
    return <Badge variant={variants[estado]}>{labels[estado]}</Badge>;
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
        if (!v.precio) return <span className="text-text-muted">{t('marketplace.consultPrice')}</span>;
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
          {v.publicacionId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* TODO: Editar publicación */ }}
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
          keyExtractor={(v) => v.vehiculoId}
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
