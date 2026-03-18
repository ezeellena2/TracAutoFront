import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReceiptText, Plus, Edit, Trash2 } from 'lucide-react';
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
import { useRecargosPage } from '../hooks/useRecargosPage';
import { RecargoModal } from '../components/RecargoModal';
import { CategoriaAlquiler } from '../types/vehiculoAlquiler';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import { TipoRecargo } from '../types/recargo';
import type { RecargoAlquilerDto } from '../types/recargo';

export function RecargosPage() {
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
    recargoSeleccionado,
    openCreate,
    openEdit,
    openDelete,
    handleDelete,
    isDeleting,
  } = useRecargosPage();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Opciones de filtros
  const tipoOptions = useMemo(() =>
    Object.values(TipoRecargo)
      .filter(v => typeof v === 'number')
      .map(v => ({ value: v as number, label: t(`alquileres.recargos.tipos.${v}`) })),
    [t]
  );

  const categoriaOptions = useMemo(() =>
    Object.values(CategoriaAlquiler)
      .filter(v => typeof v === 'number')
      .map(v => ({ value: v as number, label: t(`alquileres.flota.categorias.${v}`) })),
    [t]
  );

  // Config de filtros
  const filtersConfig: FilterConfig[] = useMemo(() => [
    {
      key: 'buscar',
      label: t('alquileres.recargos.filtros.buscar'),
      type: 'text',
      placeholder: t('alquileres.recargos.filtros.buscarPlaceholder'),
    },
    {
      key: 'tipoRecargo',
      label: t('alquileres.recargos.filtros.tipo'),
      type: 'select',
      options: tipoOptions,
      placeholder: t('alquileres.recargos.filtros.tipoPlaceholder'),
    },
    {
      key: 'categoriaAlquiler',
      label: t('alquileres.recargos.filtros.categoria'),
      type: 'select',
      options: categoriaOptions,
      placeholder: t('alquileres.recargos.filtros.categoriaPlaceholder'),
    },
    {
      key: 'soloActivos',
      label: t('alquileres.recargos.filtros.soloActivos'),
      type: 'boolean',
    },
    {
      key: 'soloObligatorios',
      label: t('alquileres.recargos.filtros.soloObligatorios'),
      type: 'boolean',
    },
  ], [t, tipoOptions, categoriaOptions]);

  // Renderizar precios
  const renderPrecios = (item: RecargoAlquilerDto) => {
    const parts: string[] = [];
    if (item.precioFijo !== null) parts.push(formatCurrency(item.precioFijo));
    if (item.precioPorDia !== null) parts.push(`${formatCurrency(item.precioPorDia)}/d`);
    if (item.porcentajeSobreTotal !== null) parts.push(`${item.porcentajeSobreTotal}%`);
    return parts.join(' | ') || '—';
  };

  // Columnas de tabla
  const columns = useMemo(() => [
    {
      key: 'nombre',
      header: t('alquileres.recargos.tabla.nombre'),
      render: (item: RecargoAlquilerDto) => (
        <span className="font-medium text-text">{item.nombre}</span>
      ),
    },
    {
      key: 'tipo',
      header: t('alquileres.recargos.tabla.tipo'),
      render: (item: RecargoAlquilerDto) => (
        <Badge variant="info">
          {t(`alquileres.recargos.tipos.${item.tipoRecargo}`)}
        </Badge>
      ),
    },
    {
      key: 'precios',
      header: t('alquileres.recargos.tabla.precios'),
      render: (item: RecargoAlquilerDto) => (
        <span className="text-text font-medium">{renderPrecios(item)}</span>
      ),
    },
    {
      key: 'obligatorio',
      header: t('alquileres.recargos.tabla.obligatorio'),
      render: (item: RecargoAlquilerDto) => (
        <Badge variant={item.obligatorio ? 'warning' : 'default'}>
          {item.obligatorio ? t('alquileres.recargos.tabla.si') : t('alquileres.recargos.tabla.no')}
        </Badge>
      ),
    },
    {
      key: 'categoria',
      header: t('alquileres.recargos.tabla.categoria'),
      render: (item: RecargoAlquilerDto) => (
        item.categoriaAlquiler !== null
          ? <Badge variant="info">{t(`alquileres.flota.categorias.${item.categoriaAlquiler}`)}</Badge>
          : <span className="text-text-muted">{t('alquileres.recargos.tabla.todasCategorias')}</span>
      ),
      mobileHidden: true,
    },
    {
      key: 'estado',
      header: t('alquileres.recargos.tabla.estado'),
      render: (item: RecargoAlquilerDto) => (
        <Badge variant={item.activo ? 'success' : 'default'}>
          {item.activo ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: t('alquileres.recargos.tabla.acciones'),
      render: (item: RecargoAlquilerDto) => {
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
                {t('alquileres.recargos.acciones.editar')}
              </button>
            )}
            {canConfig && item.activo && (
              <button
                onClick={() => { setOpenMenuId(null); openDelete(item); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-border transition-colors"
              >
                <Trash2 size={14} />
                {t('alquileres.recargos.acciones.desactivar')}
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
          <h1 className="text-2xl font-bold text-text">{t('alquileres.recargos.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.recargos.subtitulo')}</p>
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
          <h1 className="text-2xl font-bold text-text">{t('alquileres.recargos.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.recargos.subtitulo')}</p>
        </div>
        {can('alquileres:configurar') && (
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-2" />
            {t('alquileres.recargos.agregar')}
          </Button>
        )}
      </div>

      {/* KPI Card */}
      <KPICard
        title={t('alquileres.recargos.totalRecargos')}
        value={data?.totalRegistros ?? 0}
        icon={ReceiptText}
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
            titulo={t('alquileres.recargos.titulo')}
            descripcion={Object.keys(filters).length > 0
              ? t('filters.noResults')
              : t('common.noData')
            }
            icono={<ReceiptText className="w-16 h-16" />}
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
      <RecargoModal
        isOpen={isFormOpen}
        recargo={recargoSeleccionado}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
      />

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('alquileres.recargos.confirmarEliminar')}
        description={t('alquileres.recargos.confirmarEliminarMsg', { nombre: recargoSeleccionado?.nombre })}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
