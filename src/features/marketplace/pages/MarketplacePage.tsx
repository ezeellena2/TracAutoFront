import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Plus, Edit2, Pause, Play, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, Table, Badge, Button, Modal, PaginationControls } from '@/shared/ui';
import { marketplaceApi } from '@/services/endpoints';
import { usePaginationParams, useLocalization, useErrorHandler, useCurrencies } from '@/hooks';
import { toast } from '@/store/toast.store';
import { EstadoPublicacion, type VehiculoMarketplaceDto, type PublicarVehiculoRequest, type EditarPublicacionRequest, type ListaPaginada } from '@/shared/types/api';
import { formatNumber } from '@/shared/utils';

export function MarketplacePage() {
    const { t } = useTranslation();
    const { getErrorMessage } = useErrorHandler();
    const localization = useLocalization();
    const { currencies, formatPrice } = useCurrencies();

    // Estado de datos
    const [marketplaceData, setMarketplaceData] = useState<ListaPaginada<VehiculoMarketplaceDto> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Paginación
    const { setNumeroPagina, setTamanoPagina, params: paginationParams } = usePaginationParams({ initialPageSize: 10 });

    // Modal de publicar
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [vehicleToPublish, setVehicleToPublish] = useState<VehiculoMarketplaceDto | null>(null);
    const [publishForm, setPublishForm] = useState<PublicarVehiculoRequest>({
        precio: null,
        moneda: 'ARS',
        kilometraje: 0,
        descripcion: null,
    });

    // Modal de editar
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [publicationToEdit, setPublicationToEdit] = useState<VehiculoMarketplaceDto | null>(null);
    const [editForm, setEditForm] = useState<EditarPublicacionRequest>({
        precio: null,
        moneda: 'ARS',
        kilometraje: 0,
        descripcion: null,
        estado: EstadoPublicacion.Borrador,
    });

    // Cargar datos
    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await marketplaceApi.getVehiculosMarketplace(paginationParams);
            setMarketplaceData(result);
        } catch (e) {
            const errorMsg = getErrorMessage(e);
            setError(errorMsg);

            // Si es error de tipo de organización, mostrar mensaje específico
            if (errorMsg.includes('concesionaria') || errorMsg.includes('Concesionaria')) {
                toast.error(t('marketplace.errors.notConcesionaria'));
            } else {
                toast.error(t('marketplace.errors.loadFailed'));
            }
        } finally {
            setIsLoading(false);
        }
    }, [paginationParams, getErrorMessage, t]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // Ajustar página si excede el total
    useEffect(() => {
        if (
            marketplaceData &&
            marketplaceData.totalPaginas > 0 &&
            marketplaceData.paginaActual > marketplaceData.totalPaginas
        ) {
            setNumeroPagina(marketplaceData.totalPaginas);
        }
    }, [marketplaceData, setNumeroPagina]);

    // --- Publicar vehículo ---
    const handleOpenPublish = (vehicle: VehiculoMarketplaceDto) => {
        setVehicleToPublish(vehicle);
        setPublishForm({
            precio: null,
            moneda: 'ARS',
            kilometraje: 0,
            descripcion: null,
        });
        setIsPublishModalOpen(true);
    };

    const handlePublish = async () => {
        if (!vehicleToPublish) return;

        setIsPublishing(true);
        try {
            await marketplaceApi.publicarVehiculo(vehicleToPublish.vehiculoId, publishForm);
            toast.success(t('marketplace.success.published'));
            setIsPublishModalOpen(false);
            setVehicleToPublish(null);
            await loadData();
        } catch (e) {
            toast.error(getErrorMessage(e));
        } finally {
            setIsPublishing(false);
        }
    };

    // --- Editar publicación ---
    const handleOpenEdit = (publication: VehiculoMarketplaceDto) => {
        if (!publication.publicacionId) return;

        setPublicationToEdit(publication);
        setEditForm({
            precio: publication.precio,
            moneda: publication.moneda || 'ARS',
            kilometraje: publication.kilometraje,
            descripcion: publication.descripcion,
            estado: publication.estadoPublicacion || EstadoPublicacion.Borrador,
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!publicationToEdit || !publicationToEdit.publicacionId) return;

        setIsUpdating(true);
        try {
            await marketplaceApi.editarPublicacion(publicationToEdit.publicacionId, editForm);
            toast.success(t('marketplace.success.updated'));
            setIsEditModalOpen(false);
            setPublicationToEdit(null);
            await loadData();
        } catch (e) {
            toast.error(getErrorMessage(e));
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Cambio rápido de estado ---
    const handleQuickStateChange = async (publication: VehiculoMarketplaceDto, newState: EstadoPublicacion) => {
        if (!publication.publicacionId) return;

        try {
            await marketplaceApi.editarPublicacion(publication.publicacionId, {
                precio: publication.precio,
                moneda: publication.moneda || 'ARS',
                kilometraje: publication.kilometraje,
                descripcion: publication.descripcion,
                estado: newState,
            });

            if (newState === EstadoPublicacion.Pausado) {
                toast.success(t('marketplace.success.paused'));
            } else if (newState === EstadoPublicacion.Publicado) {
                toast.success(t('marketplace.success.reactivated'));
            } else if (newState === EstadoPublicacion.Vendido) {
                toast.success(t('marketplace.success.markedAsSold'));
            }

            await loadData();
        } catch (e) {
            toast.error(getErrorMessage(e));
        }
    };

    // --- Calcular estadísticas ---
    const stats = marketplaceData?.items?.reduce(
        (acc, v) => {
            if (v.estadoPublicacion === EstadoPublicacion.Publicado) acc.publicados++;
            else if (v.estadoPublicacion === EstadoPublicacion.Borrador) acc.borradores++;
            else if (v.estadoPublicacion === EstadoPublicacion.Pausado) acc.pausados++;
            else if (v.estadoPublicacion === EstadoPublicacion.Vendido) acc.vendidos++;
            return acc;
        },
        { publicados: 0, borradores: 0, pausados: 0, vendidos: 0 }
    ) || { publicados: 0, borradores: 0, pausados: 0, vendidos: 0 };

    // --- Badge de estado ---
    const getEstadoBadge = (estado: EstadoPublicacion | null) => {
        if (!estado) return <Badge variant="default">{t('marketplace.table.notPublished')}</Badge>;

        switch (estado) {
            case EstadoPublicacion.Borrador:
                return <Badge variant="default">{t('marketplace.status.borrador')}</Badge>;
            case EstadoPublicacion.Publicado:
                return <Badge variant="success">{t('marketplace.status.publicado')}</Badge>;
            case EstadoPublicacion.Pausado:
                return <Badge variant="warning">{t('marketplace.status.pausado')}</Badge>;
            case EstadoPublicacion.Vendido:
                return <Badge variant="info">{t('marketplace.status.vendido')}</Badge>;
            default:
                return <Badge variant="default">-</Badge>;
        }
    };

    // --- Columnas de la tabla ---
    const columns = [
        {
            key: 'patente',
            header: t('marketplace.table.licensePlate'),
            render: (v: VehiculoMarketplaceDto) => (
                <span className="font-medium">{v.patente}</span>
            ),
        },
        {
            key: 'vehiculo',
            header: t('marketplace.table.vehicle'),
            render: (v: VehiculoMarketplaceDto) => (
                <div className="text-sm">
                    {v.marca && v.modelo ? `${v.marca} ${v.modelo}` : '-'}
                    {v.año && <span className="text-gray-500 dark:text-gray-400"> ({v.año})</span>}
                </div>
            ),
        },
        {
            key: 'kilometraje',
            header: t('marketplace.table.mileage'),
            render: (v: VehiculoMarketplaceDto) => (
                v.publicacionId ? (
                    <span>{formatNumber(v.kilometraje, localization.culture)} {t('marketplace.table.km')}</span>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            ),
        },
        {
            key: 'precio',
            header: t('marketplace.table.price'),
            render: (v: VehiculoMarketplaceDto) => {
                if (!v.publicacionId) return <span className="text-gray-400">-</span>;
                if (!v.precio) return <span className="text-gray-500 italic">{t('marketplace.table.consultPrice')}</span>;
                return <span className="font-semibold">{formatPrice(v.precio, v.moneda || 'ARS')}</span>;
            },
        },
        {
            key: 'estado',
            header: t('marketplace.table.publicationStatus'),
            render: (v: VehiculoMarketplaceDto) => getEstadoBadge(v.estadoPublicacion),
        },
        {
            key: 'actions',
            header: t('marketplace.table.actions'),
            render: (v: VehiculoMarketplaceDto) => (
                <div className="flex gap-2">
                    {!v.publicacionId && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPublish(v)}
                        >
                            <Plus size={16} className="mr-2" />
                            {t('marketplace.actions.publish')}
                        </Button>
                    )}

                    {v.publicacionId && v.estadoPublicacion !== EstadoPublicacion.Vendido && (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEdit(v)}
                                title={t('marketplace.actions.edit')}
                            >
                                <Edit2 size={16} />
                            </Button>

                            {v.estadoPublicacion === EstadoPublicacion.Publicado && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuickStateChange(v, EstadoPublicacion.Pausado)}
                                    title={t('marketplace.actions.pause')}
                                >
                                    <Pause size={16} />
                                </Button>
                            )}

                            {v.estadoPublicacion === EstadoPublicacion.Pausado && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuickStateChange(v, EstadoPublicacion.Publicado)}
                                    title={t('marketplace.actions.reactivate')}
                                >
                                    <Play size={16} />
                                </Button>
                            )}

                            {(v.estadoPublicacion === EstadoPublicacion.Publicado || v.estadoPublicacion === EstadoPublicacion.Pausado) && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleQuickStateChange(v, EstadoPublicacion.Vendido)}
                                    title={t('marketplace.actions.markAsSold')}
                                >
                                    <CheckCircle size={16} />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <ShoppingCart size={32} className="text-primary" />
                    {t('marketplace.title')}
                </h1>
                <p className="text-muted-foreground mt-2">{t('marketplace.subtitle')}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{t('marketplace.totalPublished')}</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.publicados}</p>
                        </div>
                        <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{t('marketplace.totalDrafts')}</p>
                            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.borradores}</p>
                        </div>
                        <Edit2 className="text-gray-600 dark:text-gray-400" size={24} />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{t('marketplace.totalPaused')}</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pausados}</p>
                        </div>
                        <Pause className="text-orange-600 dark:text-orange-400" size={24} />
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{t('marketplace.totalSold')}</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.vendidos}</p>
                        </div>
                        <CheckCircle className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                </Card>
            </div>

            {/* Tabla */}
            <Card>
                <div className="p-6">
                    {isLoading && <p>{t('marketplace.loading')}</p>}

                    {error && (
                        <div className="text-center py-8">
                            <p className="text-destructive mb-4">{error}</p>
                            <Button onClick={loadData}>{t('marketplace.retry')}</Button>
                        </div>
                    )}

                    {!isLoading && !error && marketplaceData && marketplaceData.items.length === 0 && (
                        <div className="text-center py-12">
                            <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
                            <p className="text-xl font-semibold mb-2">{t('marketplace.emptyTitle')}</p>
                            <p className="text-muted-foreground">{t('marketplace.emptyDescription')}</p>
                        </div>
                    )}

                    {!isLoading && !error && marketplaceData && marketplaceData.items.length > 0 && (
                        <>
                            <Table
                                data={marketplaceData.items}
                                columns={columns}
                                keyExtractor={(item) => item.vehiculoId}
                            />

                            <div className="mt-6">
                                <PaginationControls
                                    paginaActual={marketplaceData.paginaActual}
                                    totalPaginas={marketplaceData.totalPaginas}
                                    tamanoPagina={marketplaceData.tamanoPagina}
                                    totalRegistros={marketplaceData.totalRegistros}
                                    onPageChange={setNumeroPagina}
                                    onPageSizeChange={setTamanoPagina}
                                    disabled={isLoading}
                                />
                            </div>
                        </>
                    )}
                </div>
            </Card>

            {/* Modal Publicar */}
            {vehicleToPublish && (
                <Modal
                    isOpen={isPublishModalOpen}
                    onClose={() => {
                        setIsPublishModalOpen(false);
                        setVehicleToPublish(null);
                    }}
                    title={`${t('marketplace.publishVehicle')} - ${vehicleToPublish.patente}`}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">{t('marketplace.form.price')}</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder={t('marketplace.form.pricePlaceholder')}
                                value={publishForm.precio || ''}
                                onChange={(e) => setPublishForm({ ...publishForm, precio: e.target.value ? parseFloat(e.target.value) : null })}
                            />
                            <p className="text-xs text-muted-foreground mt-1">{t('marketplace.form.priceHelper')}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('marketplace.form.currency')}</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md"
                                value={publishForm.moneda}
                                onChange={(e) => setPublishForm({ ...publishForm, moneda: e.target.value })}
                            >
                                {currencies.map((currency) => (
                                    <option key={currency.code} value={currency.code}>
                                        {currency.code} ({currency.name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('marketplace.form.mileage')} *</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder={t('marketplace.form.mileagePlaceholder')}
                                value={publishForm.kilometraje}
                                onChange={(e) => setPublishForm({ ...publishForm, kilometraje: parseInt(e.target.value) || 0 })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('marketplace.form.description')}</label>
                            <textarea
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder={t('marketplace.form.descriptionPlaceholder')}
                                rows={4}
                                maxLength={4000}
                                value={publishForm.descripcion || ''}
                                onChange={(e) => setPublishForm({ ...publishForm, descripcion: e.target.value || null })}
                            />
                            <p className="text-xs text-muted-foreground mt-1">{t('marketplace.form.descriptionHelper')}</p>
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                            <Button variant="outline" onClick={() => setIsPublishModalOpen(false)} disabled={isPublishing}>
                                {t('common.cancel')}
                            </Button>
                            <Button onClick={handlePublish} disabled={isPublishing || publishForm.kilometraje === 0}>
                                {isPublishing ? `${t('common.loading')}...` : t('marketplace.actions.publish')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal Editar */}
            {publicationToEdit && (
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setPublicationToEdit(null);
                    }}
                    title={`${t('marketplace.editPublication')} - ${publicationToEdit.patente}`}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">{t('marketplace.form.price')}</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-md"
                                placeholder={t('marketplace.form.pricePlaceholder')}
                                value={editForm.precio || ''}
                                onChange={(e) => setEditForm({ ...editForm, precio: e.target.value ? parseFloat(e.target.value) : null })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('marketplace.form.currency')}</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md"
                                value={editForm.moneda || 'ARS'}
                                onChange={(e) => setEditForm({ ...editForm, moneda: e.target.value })}
                            >
                                {currencies.map((currency) => (
                                    <option key={currency.code} value={currency.code}>
                                        {currency.code} ({currency.name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('marketplace.form.mileage')} *</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-md"
                                value={editForm.kilometraje}
                                onChange={(e) => setEditForm({ ...editForm, kilometraje: parseInt(e.target.value) || 0 })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('marketplace.form.description')}</label>
                            <textarea
                                className="w-full px-3 py-2 border rounded-md"
                                rows={4}
                                maxLength={4000}
                                value={editForm.descripcion || ''}
                                onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value || null })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">{t('marketplace.form.publicationStatus')}</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md"
                                value={editForm.estado}
                                onChange={(e) => setEditForm({ ...editForm, estado: parseInt(e.target.value) as EstadoPublicacion })}
                            >
                                <option value={EstadoPublicacion.Borrador}>{t('marketplace.status.borrador')}</option>
                                <option value={EstadoPublicacion.Publicado}>{t('marketplace.status.publicado')}</option>
                                <option value={EstadoPublicacion.Pausado}>{t('marketplace.status.pausado')}</option>
                                <option value={EstadoPublicacion.Vendido}>{t('marketplace.status.vendido')}</option>
                            </select>
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating}>
                                {t('common.cancel')}
                            </Button>
                            <Button onClick={handleUpdate} disabled={isUpdating || editForm.kilometraje === 0}>
                                {isUpdating ? `${t('common.loading')}...` : t('common.save')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
