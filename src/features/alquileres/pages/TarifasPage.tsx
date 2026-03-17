import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Table,
  KPICard,
  PaginationControls,
  AdvancedFilterBar,
  EstadoVacio,
  EstadoError,
  ActionMenu,
} from '@/shared/ui';
import { ConfirmationModal } from '@/shared/ui/ConfirmationModal';
import type { FilterConfig } from '@/shared/ui/AdvancedFilter/types';
import { usePermissions, useLocalization } from '@/hooks';
import { formatDate } from '@/shared/utils/dateFormatter';
import { formatPrecio } from '../utils/formatters';
import { useTarifasPage } from '../hooks/useTarifasPage';
import { TarifaModal } from '../components/TarifaModal';
import { CategoriaAlquiler } from '../types/vehiculoAlquiler';
import { UnidadTiempoTarifa } from '../types/tarifa';
import type { TarifaAlquilerDto } from '../types/tarifa';

export function TarifasPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const localization = useLocalization();
  const culture = localization.culture;
  const timeZoneId = localization.timeZoneId;

  const {
    data,
    items,
    isLoading,
    error,
    loadData,
    setNumeroPagina,
    setTamanoPagina,
    filters,
    setFilter,
    clearFilters,
    sucursales,
    isFormOpen,
    setIsFormOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    tarifaSeleccionada,
    openCreate,
    openEdit,
    openDelete,
    handleDelete,
    isDeleting,
  } = useTarifasPage();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Opciones de filtros
  const categoriaOptions = useMemo(() =>
    Object.values(CategoriaAlquiler)
      .filter(v => typeof v === 'number')
      .map(v => ({ value: v as number, label: t(`alquileres.flota.categorias.${v}`) })),
    [t]
  );

  const unidadOptions = useMemo(() =>
    Object.values(UnidadTiempoTarifa)
      .filter(v => typeof v === 'number')
      .map(v => ({ value: v as number, label: t(`alquileres.tarifas.unidades.${v}`) })),
    [t]
  );

  const sucursalOptions = useMemo(() =>
    sucursales.map(s => ({ value: s.id, label: `${s.nombre} — ${s.ciudad}` })),
    [sucursales]
  );

  // Config de filtros
  const filtersConfig: FilterConfig[] = useMemo(() => [
    {
      key: 'buscar',
      label: t('alquileres.tarifas.filtros.buscar'),
      type: 'text',
      placeholder: t('alquileres.tarifas.filtros.buscarPlaceholder'),
    },
    {
      key: 'categoriaAlquiler',
      label: t('alquileres.tarifas.filtros.categoria'),
      type: 'select',
      options: categoriaOptions,
      placeholder: t('alquileres.tarifas.filtros.categoriaPlaceholder'),
    },
    {
      key: 'sucursalId',
      label: t('alquileres.tarifas.filtros.sucursal'),
      type: 'select',
      options: sucursalOptions,
      placeholder: t('alquileres.tarifas.filtros.sucursalPlaceholder'),
    },
    {
      key: 'unidadTiempo',
      label: t('alquileres.tarifas.filtros.unidadTiempo'),
      type: 'select',
      options: unidadOptions,
      placeholder: t('alquileres.tarifas.filtros.unidadTiempoPlaceholder'),
    },
    {
      key: 'soloActivas',
      label: t('alquileres.tarifas.filtros.soloActivas'),
      type: 'boolean',
    },
  ], [t, categoriaOptions, unidadOptions, sucursalOptions]);

  // Columnas de tabla
  const columns = useMemo(() => [
    {
      key: 'nombre',
      header: t('alquileres.tarifas.tabla.nombre'),
      render: (item: TarifaAlquilerDto) => (
        <span className="font-medium text-text">{item.nombre}</span>
      ),
    },
    {
      key: 'categoria',
      header: t('alquileres.tarifas.tabla.categoria'),
      render: (item: TarifaAlquilerDto) => (
        item.categoriaAlquiler !== null
          ? <Badge variant="info">{t(`alquileres.flota.categorias.${item.categoriaAlquiler}`)}</Badge>
          : <span className="text-text-muted">{t('alquileres.tarifas.tabla.todasCategorias')}</span>
      ),
    },
    {
      key: 'unidadTiempo',
      header: t('alquileres.tarifas.tabla.unidadTiempo'),
      render: (item: TarifaAlquilerDto) => (
        <span className="text-text">{t(`alquileres.tarifas.unidades.${item.unidadTiempo}`)}</span>
      ),
    },
    {
      key: 'precio',
      header: t('alquileres.tarifas.tabla.precio'),
      render: (item: TarifaAlquilerDto) => (
        <span className="text-text font-medium">
          {formatPrecio(item.precioPorUnidad, item.moneda)}
        </span>
      ),
    },
    {
      key: 'vigencia',
      header: t('alquileres.tarifas.tabla.vigencia'),
      render: (item: TarifaAlquilerDto) => (
        <span className="text-text-muted text-sm">
          {formatDate(item.vigenciaDesde, culture, timeZoneId)} — {formatDate(item.vigenciaHasta, culture, timeZoneId)}
        </span>
      ),
      mobileHidden: true,
    },
    {
      key: 'prioridad',
      header: t('alquileres.tarifas.tabla.prioridad'),
      render: (item: TarifaAlquilerDto) => (
        <span className="text-text">{item.prioridad}</span>
      ),
      mobileHidden: true,
    },
    {
      key: 'estado',
      header: t('alquileres.tarifas.tabla.estado'),
      render: (item: TarifaAlquilerDto) => (
        <Badge variant={item.activa ? 'success' : 'default'}>
          {item.activa ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: t('alquileres.tarifas.tabla.acciones'),
      render: (item: TarifaAlquilerDto) => {
        const canConfig = can('alquileres:configurar');
        return (
          <ActionMenu
            isOpen={openMenuId === item.id}
            onToggle={() => setOpenMenuId(prev => prev === item.id ? null : item.id)}
            onClose={() => setOpenMenuId(null)}
          >
            {canConfig && (
              <button
                onClick={() => { setOpenMenuId(null); openEdit(item); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-border transition-colors"
              >
                <Edit size={14} />
                {t('alquileres.tarifas.acciones.editar')}
              </button>
            )}
            {canConfig && item.activa && (
              <button
                onClick={() => { setOpenMenuId(null); openDelete(item); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-border transition-colors"
              >
                <Trash2 size={14} />
                {t('alquileres.tarifas.acciones.desactivar')}
              </button>
            )}
          </ActionMenu>
        );
      },
    },
  ], [t, can, openMenuId, openEdit, openDelete]);

  // Estado de error
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('alquileres.tarifas.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.tarifas.subtitulo')}</p>
        </div>
        <Card>
          <EstadoError mensaje={error} onReintentar={loadData} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('alquileres.tarifas.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.tarifas.subtitulo')}</p>
        </div>
        {can('alquileres:configurar') && (
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-2" />
            {t('alquileres.tarifas.agregar')}
          </Button>
        )}
      </div>

      {/* KPI Card */}
      <KPICard
        title={t('alquileres.tarifas.totalTarifas')}
        value={data?.totalRegistros ?? 0}
        icon={DollarSign}
        color="primary"
      />

      {/* Filtros */}
      <AdvancedFilterBar
        config={filtersConfig}
        filters={filters}
        onFilterChange={(key, value) => setFilter(key, value, 'eq')}
        onClearFilters={clearFilters}
      />

      {/* Tabla */}
      <Card padding="none">
        {items.length === 0 && !isLoading ? (
          <EstadoVacio
            titulo={t('alquileres.tarifas.titulo')}
            descripcion={Object.keys(filters).length > 0
              ? t('filters.noResults')
              : t('common.noData')
            }
            icono={<DollarSign className="w-16 h-16" />}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={items}
              keyExtractor={(item) => item.id}
              isLoading={isLoading}
            />
            {data && data.totalRegistros > 0 && (
              <PaginationControls
                paginaActual={data.paginaActual}
                totalPaginas={data.totalPaginas}
                tamanoPagina={data.tamanoPagina}
                totalRegistros={data.totalRegistros}
                onPageChange={setNumeroPagina}
                onPageSizeChange={setTamanoPagina}
                disabled={isLoading}
              />
            )}
          </>
        )}
      </Card>

      {/* Modales */}
      <TarifaModal
        isOpen={isFormOpen}
        tarifa={tarifaSeleccionada}
        sucursales={sucursales}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
      />

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('alquileres.tarifas.confirmarEliminar')}
        description={t('alquileres.tarifas.confirmarEliminarMsg', { nombre: tarifaSeleccionada?.nombre })}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
