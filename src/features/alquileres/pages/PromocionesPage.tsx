import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Plus, Edit, Trash2 } from 'lucide-react';
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
import { usePermissions } from '@/hooks';
import { usePromocionesPage } from '../hooks/usePromocionesPage';
import { PromocionModal } from '../components/PromocionModal';
import { TipoDescuento } from '../types/promocion';
import type { PromocionAlquilerDto } from '../types/promocion';

export function PromocionesPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();

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
    isFormOpen,
    setIsFormOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    promocionSeleccionada,
    openCreate,
    openEdit,
    openDelete,
    handleDelete,
    isDeleting,
  } = usePromocionesPage();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Config de filtros
  const filtersConfig: FilterConfig[] = useMemo(() => [
    {
      key: 'buscar',
      label: t('alquileres.promociones.filtros.buscar'),
      type: 'text',
      placeholder: t('alquileres.promociones.filtros.buscarPlaceholder'),
    },
    {
      key: 'soloActivas',
      label: t('alquileres.promociones.filtros.soloActivas'),
      type: 'boolean',
    },
    {
      key: 'soloVigentes',
      label: t('alquileres.promociones.filtros.soloVigentes'),
      type: 'boolean',
    },
  ], [t]);

  // Determinar si una promoción está vigente
  const isVigente = (item: PromocionAlquilerDto) => {
    const ahora = new Date();
    return new Date(item.vigenciaDesde) <= ahora && new Date(item.vigenciaHasta) >= ahora;
  };

  // Columnas de tabla
  const columns = useMemo(() => [
    {
      key: 'codigo',
      header: t('alquileres.promociones.tabla.codigo'),
      render: (item: PromocionAlquilerDto) => (
        <span className="font-medium text-text font-mono">{item.codigo}</span>
      ),
    },
    {
      key: 'descripcion',
      header: t('alquileres.promociones.tabla.descripcion'),
      render: (item: PromocionAlquilerDto) => (
        <span className="text-text-muted text-sm truncate max-w-[200px] block">
          {item.descripcion || t('common.noData')}
        </span>
      ),
    },
    {
      key: 'tipoDescuento',
      header: t('alquileres.promociones.tabla.tipoDescuento'),
      render: (item: PromocionAlquilerDto) => (
        <Badge variant="info">
          {t(`alquileres.promociones.tiposDescuento.${item.tipoDescuento}`)}
        </Badge>
      ),
    },
    {
      key: 'valorDescuento',
      header: t('alquileres.promociones.tabla.valorDescuento'),
      render: (item: PromocionAlquilerDto) => (
        <span className="text-text font-medium">
          {item.tipoDescuento === TipoDescuento.Porcentaje
            ? `${item.valorDescuento}%`
            : `$${item.valorDescuento.toLocaleString()}`
          }
        </span>
      ),
    },
    {
      key: 'vigencia',
      header: t('alquileres.promociones.tabla.vigencia'),
      render: (item: PromocionAlquilerDto) => (
        <div className="text-sm">
          <span className="text-text-muted">
            {item.vigenciaDesde.split('T')[0]} — {item.vigenciaHasta.split('T')[0]}
          </span>
          <div className="mt-0.5">
            <Badge variant={isVigente(item) ? 'success' : 'default'}>
              {isVigente(item) ? t('alquileres.promociones.tabla.vigente') : t('alquileres.promociones.tabla.expirada')}
            </Badge>
          </div>
        </div>
      ),
      mobileHidden: true,
    },
    {
      key: 'usos',
      header: t('alquileres.promociones.tabla.usos'),
      render: (item: PromocionAlquilerDto) => (
        <span className="text-text">
          {item.usosActuales}/{item.usosMaximos !== null ? item.usosMaximos : t('common.ilimitado')}
        </span>
      ),
      mobileHidden: true,
    },
    {
      key: 'estado',
      header: t('alquileres.promociones.tabla.estado'),
      render: (item: PromocionAlquilerDto) => (
        <Badge variant={item.activa ? 'success' : 'default'}>
          {item.activa ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: t('alquileres.promociones.tabla.acciones'),
      render: (item: PromocionAlquilerDto) => {
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
                {t('alquileres.promociones.acciones.editar')}
              </button>
            )}
            {canConfig && item.activa && (
              <button
                onClick={() => { setOpenMenuId(null); openDelete(item); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-border transition-colors"
              >
                <Trash2 size={14} />
                {t('alquileres.promociones.acciones.desactivar')}
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
          <h1 className="text-2xl font-bold text-text">{t('alquileres.promociones.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.promociones.subtitulo')}</p>
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
          <h1 className="text-2xl font-bold text-text">{t('alquileres.promociones.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.promociones.subtitulo')}</p>
        </div>
        {can('alquileres:configurar') && (
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-2" />
            {t('alquileres.promociones.agregar')}
          </Button>
        )}
      </div>

      {/* KPI Card */}
      <KPICard
        title={t('alquileres.promociones.totalPromociones')}
        value={data?.totalRegistros ?? 0}
        icon={Tag}
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
            titulo={t('alquileres.promociones.titulo')}
            descripcion={Object.keys(filters).length > 0
              ? t('filters.noResults')
              : t('common.noData')
            }
            icono={<Tag className="w-16 h-16" />}
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
      <PromocionModal
        isOpen={isFormOpen}
        promocion={promocionSeleccionada}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
      />

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('alquileres.promociones.confirmarEliminar')}
        description={t('alquileres.promociones.confirmarEliminarMsg', { codigo: promocionSeleccionada?.codigo })}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
