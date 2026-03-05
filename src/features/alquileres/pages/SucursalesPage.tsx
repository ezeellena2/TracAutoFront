import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, Plus, Edit, Trash2 } from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Table,
  KPICard,
  PaginationControls,
  AdvancedFilterBar,
  ConfirmationModal,
  EstadoVacio,
  EstadoError,
  ActionMenu,
} from '@/shared/ui';
import type { FilterConfig } from '@/shared/ui/AdvancedFilter/types';
import { usePermissions } from '@/hooks';
import { useSucursalesPage } from '../hooks/useSucursalesPage';
import { CreateSucursalModal } from '../components/CreateSucursalModal';
import { EditSucursalModal } from '../components/EditSucursalModal';
import type { SucursalDto } from '../types/sucursal';

export function SucursalesPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();

  const {
    sucursalesData,
    sucursales,
    isLoading,
    error,
    loadData,
    setNumeroPagina,
    setTamanoPagina,
    filters,
    setFilter,
    clearFilters,
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    sucursalSeleccionada,
    openEdit,
    isDeleteOpen,
    setIsDeleteOpen,
    openDelete,
    handleDelete,
    isDeleting,
  } = useSucursalesPage();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Configuracion de filtros
  const filtersConfig: FilterConfig[] = useMemo(() => [
    {
      key: 'buscar',
      label: t('alquileres.sucursales.filtros.buscar'),
      type: 'text',
      placeholder: t('alquileres.sucursales.filtros.buscarPlaceholder'),
    },
    {
      key: 'ciudad',
      label: t('alquileres.sucursales.filtros.ciudad'),
      type: 'text',
      placeholder: t('alquileres.sucursales.filtros.ciudadPlaceholder'),
    },
    {
      key: 'activa',
      label: t('alquileres.sucursales.filtros.estado'),
      type: 'boolean',
    },
  ], [t]);

  // Columnas de la tabla
  const columns = useMemo(() => [
    {
      key: 'nombre',
      header: t('alquileres.sucursales.tabla.nombre'),
      render: (s: SucursalDto) => (
        <div>
          <p className="font-medium text-text">{s.nombre}</p>
          <p className="text-xs text-text-muted truncate max-w-[200px]">{s.direccion}</p>
        </div>
      ),
    },
    {
      key: 'ciudad',
      header: t('alquileres.sucursales.tabla.ciudad'),
      render: (s: SucursalDto) => (
        <span className="text-text">{s.ciudad}, {s.provincia}</span>
      ),
    },
    {
      key: 'estado',
      header: t('alquileres.sucursales.tabla.estado'),
      render: (s: SucursalDto) => (
        <Badge variant={s.activa ? 'success' : 'error'}>
          {s.activa ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      key: 'telefono',
      header: t('alquileres.sucursales.tabla.telefono'),
      render: (s: SucursalDto) => (
        <span className="text-text-muted">{s.telefono || '—'}</span>
      ),
      mobileHidden: true,
    },
    {
      key: 'permiteOneWay',
      header: t('alquileres.sucursales.tabla.permiteOneWay'),
      render: (s: SucursalDto) => (
        <Badge variant={s.permiteOneWay ? 'info' : 'default'}>
          {s.permiteOneWay ? t('common.yes') : t('common.no')}
        </Badge>
      ),
      mobileHidden: true,
    },
    {
      key: 'acciones',
      header: t('alquileres.sucursales.tabla.acciones'),
      render: (s: SucursalDto) => {
        const canEdit = can('alquileres:editar');
        const canDelete = can('alquileres:eliminar') && s.activa;
        if (!canEdit && !canDelete) return null;
        return (
          <ActionMenu
            isOpen={openMenuId === s.id}
            onToggle={() => setOpenMenuId(prev => prev === s.id ? null : s.id)}
            onClose={() => setOpenMenuId(null)}
          >
            {canEdit && (
              <button
                onClick={() => { setOpenMenuId(null); openEdit(s); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-border transition-colors"
              >
                <Edit size={14} />
                {t('common.edit')}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => { setOpenMenuId(null); openDelete(s); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-border transition-colors"
              >
                <Trash2 size={14} />
                {t('alquileres.sucursales.confirmarEliminar')}
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
          <h1 className="text-2xl font-bold text-text">{t('alquileres.sucursales.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.sucursales.subtitulo')}</p>
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
          <h1 className="text-2xl font-bold text-text">{t('alquileres.sucursales.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.sucursales.subtitulo')}</p>
        </div>
        {can('alquileres:crear') && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} className="mr-2" />
            {t('alquileres.sucursales.crear')}
          </Button>
        )}
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title={t('alquileres.sucursales.totalSucursales')}
          value={sucursalesData?.totalRegistros ?? 0}
          icon={Store}
          color="primary"
        />
      </div>

      {/* Filtros */}
      <AdvancedFilterBar
        config={filtersConfig}
        filters={filters}
        onFilterChange={(key, value) => setFilter(key, value, 'eq')}
        onClearFilters={clearFilters}
      />

      {/* Tabla */}
      <Card padding="none">
        {sucursales.length === 0 && !isLoading ? (
          <EstadoVacio
            titulo={t('alquileres.sucursales.titulo')}
            descripcion={Object.keys(filters).length > 0
              ? t('filters.noResults')
              : t('common.noData')
            }
            icono={<Store className="w-16 h-16" />}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={sucursales}
              keyExtractor={(s) => s.id}
              isLoading={isLoading}
            />
            {sucursalesData && sucursalesData.totalRegistros > 0 && (
              <PaginationControls
                paginaActual={sucursalesData.paginaActual}
                totalPaginas={sucursalesData.totalPaginas}
                tamanoPagina={sucursalesData.tamanoPagina}
                totalRegistros={sucursalesData.totalRegistros}
                onPageChange={setNumeroPagina}
                onPageSizeChange={setTamanoPagina}
                disabled={isLoading}
              />
            )}
          </>
        )}
      </Card>

      {/* Modales */}
      <CreateSucursalModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadData}
      />

      <EditSucursalModal
        isOpen={isEditOpen}
        sucursalId={sucursalSeleccionada?.id ?? null}
        onClose={() => setIsEditOpen(false)}
        onSuccess={loadData}
      />

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('alquileres.sucursales.confirmarEliminar')}
        description={t('alquileres.sucursales.confirmarEliminarMsg', { nombre: sucursalSeleccionada?.nombre })}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
