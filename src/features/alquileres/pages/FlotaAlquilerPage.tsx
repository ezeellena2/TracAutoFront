import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CarFront, Plus, Edit, RefreshCw, Calendar, Trash2 } from 'lucide-react';
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
import { useFlotaAlquilerPage } from '../hooks/useFlotaAlquilerPage';
import { CreateVehiculoAlquilerModal } from '../components/CreateVehiculoAlquilerModal';
import { EditVehiculoAlquilerModal } from '../components/EditVehiculoAlquilerModal';
import { CambiarEstadoModal, ESTADO_BADGE_VARIANT } from '../components/CambiarEstadoModal';
import { DisponibilidadModal } from '../components/DisponibilidadModal';
import { CategoriaAlquiler, EstadoVehiculoAlquiler } from '../types/vehiculoAlquiler';
import type { VehiculoAlquilerDto } from '../types/vehiculoAlquiler';

export function FlotaAlquilerPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();

  const {
    flotaData,
    vehiculos,
    isLoading,
    error,
    loadData,
    setNumeroPagina,
    setTamanoPagina,
    filters,
    setFilter,
    clearFilters,
    sucursalesFiltro,
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    isEstadoOpen,
    setIsEstadoOpen,
    isDisponibilidadOpen,
    setIsDisponibilidadOpen,
    vehiculoSeleccionado,
    openEdit,
    openDelete,
    openEstado,
    openDisponibilidad,
    handleDelete,
    isDeleting,
  } = useFlotaAlquilerPage();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Opciones de filtros
  const categoriaOptions = useMemo(() =>
    Object.values(CategoriaAlquiler)
      .filter(v => typeof v === 'number')
      .map(v => ({ value: v as number, label: t(`alquileres.flota.categorias.${v}`) })),
    [t]
  );

  const estadoOptions = useMemo(() =>
    Object.values(EstadoVehiculoAlquiler)
      .filter(v => typeof v === 'number')
      .map(v => ({ value: v as number, label: t(`alquileres.flota.estados.${v}`) })),
    [t]
  );

  const sucursalOptions = useMemo(() =>
    sucursalesFiltro.map(s => ({ value: s.id, label: `${s.nombre} — ${s.ciudad}` })),
    [sucursalesFiltro]
  );

  // Config de filtros
  const filtersConfig: FilterConfig[] = useMemo(() => [
    {
      key: 'buscar',
      label: t('alquileres.flota.filtros.buscar'),
      type: 'text',
      placeholder: t('alquileres.flota.filtros.buscarPlaceholder'),
    },
    {
      key: 'categoria',
      label: t('alquileres.flota.filtros.categoria'),
      type: 'select',
      options: categoriaOptions,
      placeholder: t('alquileres.flota.filtros.categoriaPlaceholder'),
    },
    {
      key: 'estado',
      label: t('alquileres.flota.filtros.estado'),
      type: 'select',
      options: estadoOptions,
      placeholder: t('alquileres.flota.filtros.estadoPlaceholder'),
    },
    {
      key: 'sucursalId',
      label: t('alquileres.flota.filtros.sucursal'),
      type: 'select',
      options: sucursalOptions,
      placeholder: t('alquileres.flota.filtros.sucursalPlaceholder'),
    },
    {
      key: 'soloActivos',
      label: t('alquileres.flota.filtros.soloActivos'),
      type: 'boolean',
    },
  ], [t, categoriaOptions, estadoOptions, sucursalOptions]);

  // Columnas de tabla
  const columns = useMemo(() => [
    {
      key: 'vehiculo',
      header: t('alquileres.flota.tabla.vehiculo'),
      render: (v: VehiculoAlquilerDto) => (
        <div>
          <p className="font-medium text-text">{v.patente}</p>
          <p className="text-xs text-text-muted">
            {[v.marca, v.modelo, v.anio].filter(Boolean).join(' ') || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'categoria',
      header: t('alquileres.flota.tabla.categoria'),
      render: (v: VehiculoAlquilerDto) => (
        <Badge variant="info">
          {t(`alquileres.flota.categorias.${v.categoriaAlquiler}`)}
        </Badge>
      ),
    },
    {
      key: 'precioDia',
      header: t('alquileres.flota.tabla.precioDia'),
      render: (v: VehiculoAlquilerDto) => (
        <span className="text-text font-medium">
          ${v.precioBaseDiario.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'estado',
      header: t('alquileres.flota.tabla.estado'),
      render: (v: VehiculoAlquilerDto) => (
        <Badge variant={ESTADO_BADGE_VARIANT[v.estado]}>
          {t(`alquileres.flota.estados.${v.estado}`)}
        </Badge>
      ),
    },
    {
      key: 'sucursal',
      header: t('alquileres.flota.tabla.sucursal'),
      render: (v: VehiculoAlquilerDto) => (
        <span className="text-text-muted">{v.sucursalPorDefectoNombre}</span>
      ),
      mobileHidden: true,
    },
    {
      key: 'acciones',
      header: t('alquileres.flota.tabla.acciones'),
      render: (v: VehiculoAlquilerDto) => {
        const canEdit = can('alquileres:editar');
        const canDelete = can('alquileres:eliminar') && v.activo;
        return (
          <ActionMenu
            isOpen={openMenuId === v.id}
            onToggle={() => setOpenMenuId(prev => prev === v.id ? null : v.id)}
            onClose={() => setOpenMenuId(null)}
          >
            {canEdit && (
              <button
                onClick={() => { setOpenMenuId(null); openEdit(v); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-border transition-colors"
              >
                <Edit size={14} />
                {t('alquileres.flota.acciones.editar')}
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => { setOpenMenuId(null); openEstado(v); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-border transition-colors"
              >
                <RefreshCw size={14} />
                {t('alquileres.flota.acciones.cambiarEstado')}
              </button>
            )}
            <button
              onClick={() => { setOpenMenuId(null); openDisponibilidad(v); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-border transition-colors"
            >
              <Calendar size={14} />
              {t('alquileres.flota.acciones.verDisponibilidad')}
            </button>
            {canDelete && (
              <button
                onClick={() => { setOpenMenuId(null); openDelete(v); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-border transition-colors"
              >
                <Trash2 size={14} />
                {t('alquileres.flota.acciones.desactivar')}
              </button>
            )}
          </ActionMenu>
        );
      },
    },
  ], [t, can, openMenuId, openEdit, openDelete, openEstado, openDisponibilidad]);

  // Estado de error
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('alquileres.flota.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.flota.subtitulo')}</p>
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
          <h1 className="text-2xl font-bold text-text">{t('alquileres.flota.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.flota.subtitulo')}</p>
        </div>
        {can('alquileres:crear') && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} className="mr-2" />
            {t('alquileres.flota.agregar')}
          </Button>
        )}
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 gap-4">
        <KPICard
          title={t('alquileres.flota.totalVehiculos')}
          value={flotaData?.totalRegistros ?? 0}
          icon={CarFront}
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
        {vehiculos.length === 0 && !isLoading ? (
          <EstadoVacio
            titulo={t('alquileres.flota.titulo')}
            descripcion={Object.keys(filters).length > 0
              ? t('filters.noResults')
              : t('common.noData')
            }
            icono={<CarFront className="w-16 h-16" />}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={vehiculos}
              keyExtractor={(v) => v.id}
              isLoading={isLoading}
            />
            {flotaData && flotaData.totalRegistros > 0 && (
              <PaginationControls
                paginaActual={flotaData.paginaActual}
                totalPaginas={flotaData.totalPaginas}
                tamanoPagina={flotaData.tamanoPagina}
                totalRegistros={flotaData.totalRegistros}
                onPageChange={setNumeroPagina}
                onPageSizeChange={setTamanoPagina}
                disabled={isLoading}
              />
            )}
          </>
        )}
      </Card>

      {/* Modales */}
      <CreateVehiculoAlquilerModal
        isOpen={isCreateOpen}
        sucursales={sucursalesFiltro}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadData}
      />

      <EditVehiculoAlquilerModal
        isOpen={isEditOpen}
        vehiculoAlquilerId={vehiculoSeleccionado?.id ?? null}
        sucursales={sucursalesFiltro}
        onClose={() => setIsEditOpen(false)}
        onSuccess={loadData}
      />

      <CambiarEstadoModal
        isOpen={isEstadoOpen}
        vehiculo={vehiculoSeleccionado}
        onClose={() => setIsEstadoOpen(false)}
        onSuccess={loadData}
      />

      <DisponibilidadModal
        isOpen={isDisponibilidadOpen}
        vehiculo={vehiculoSeleccionado}
        onClose={() => setIsDisponibilidadOpen(false)}
      />

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('alquileres.flota.confirmarEliminar')}
        description={t('alquileres.flota.confirmarEliminarMsg', { patente: vehiculoSeleccionado?.patente })}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
