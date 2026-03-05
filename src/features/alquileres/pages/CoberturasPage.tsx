import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';
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
import { useCoberturasPage } from '../hooks/useCoberturasPage';
import { CoberturaModal } from '../components/CoberturaModal';
import type { CoberturaAlquilerDto } from '../types/cobertura';

export function CoberturasPage() {
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
    coberturaSeleccionada,
    openCreate,
    openEdit,
    openDelete,
    handleDelete,
    isDeleting,
  } = useCoberturasPage();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Config de filtros
  const filtersConfig: FilterConfig[] = useMemo(() => [
    {
      key: 'buscar',
      label: t('alquileres.coberturas.filtros.buscar'),
      type: 'text',
      placeholder: t('alquileres.coberturas.filtros.buscarPlaceholder'),
    },
    {
      key: 'soloActivas',
      label: t('alquileres.coberturas.filtros.soloActivas'),
      type: 'boolean',
    },
    {
      key: 'soloObligatorias',
      label: t('alquileres.coberturas.filtros.soloObligatorias'),
      type: 'boolean',
    },
  ], [t]);

  // Renderizar badges de coberturas
  const renderCoberturas = (item: CoberturaAlquilerDto) => {
    const coberturas: string[] = [];
    if (item.cubreRobo) coberturas.push(t('alquileres.coberturas.tabla.robo'));
    if (item.cubreVidrios) coberturas.push(t('alquileres.coberturas.tabla.vidrios'));
    if (item.cubreNeumaticos) coberturas.push(t('alquileres.coberturas.tabla.neumaticos'));
    if (item.cubreGranizo) coberturas.push(t('alquileres.coberturas.tabla.granizo'));
    return coberturas;
  };

  // Columnas de tabla
  const columns = useMemo(() => [
    {
      key: 'nombre',
      header: t('alquileres.coberturas.tabla.nombre'),
      render: (item: CoberturaAlquilerDto) => (
        <span className="font-medium text-text">{item.nombre}</span>
      ),
    },
    {
      key: 'precioPorDia',
      header: t('alquileres.coberturas.tabla.precioPorDia'),
      render: (item: CoberturaAlquilerDto) => (
        <span className="text-text font-medium">${item.precioPorDia.toLocaleString()}</span>
      ),
    },
    {
      key: 'deducible',
      header: t('alquileres.coberturas.tabla.deducible'),
      render: (item: CoberturaAlquilerDto) => (
        <span className="text-text">${item.deducibleMaximo.toLocaleString()}</span>
      ),
    },
    {
      key: 'coberturas',
      header: t('alquileres.coberturas.tabla.coberturas'),
      render: (item: CoberturaAlquilerDto) => {
        const badges = renderCoberturas(item);
        return (
          <div className="flex flex-wrap gap-1">
            {badges.length > 0
              ? badges.map(b => <Badge key={b} variant="info">{b}</Badge>)
              : <span className="text-text-muted">—</span>
            }
          </div>
        );
      },
    },
    {
      key: 'obligatoria',
      header: t('alquileres.coberturas.tabla.obligatoria'),
      render: (item: CoberturaAlquilerDto) => (
        <Badge variant={item.obligatoria ? 'warning' : 'default'}>
          {item.obligatoria ? t('alquileres.coberturas.tabla.si') : t('alquileres.coberturas.tabla.no')}
        </Badge>
      ),
      mobileHidden: true,
    },
    {
      key: 'estado',
      header: t('alquileres.coberturas.tabla.estado'),
      render: (item: CoberturaAlquilerDto) => (
        <Badge variant={item.activa ? 'success' : 'default'}>
          {item.activa ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: t('alquileres.coberturas.tabla.acciones'),
      render: (item: CoberturaAlquilerDto) => {
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
                {t('alquileres.coberturas.acciones.editar')}
              </button>
            )}
            {canConfig && item.activa && (
              <button
                onClick={() => { setOpenMenuId(null); openDelete(item); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-border transition-colors"
              >
                <Trash2 size={14} />
                {t('alquileres.coberturas.acciones.desactivar')}
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
          <h1 className="text-2xl font-bold text-text">{t('alquileres.coberturas.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.coberturas.subtitulo')}</p>
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
          <h1 className="text-2xl font-bold text-text">{t('alquileres.coberturas.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.coberturas.subtitulo')}</p>
        </div>
        {can('alquileres:configurar') && (
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-2" />
            {t('alquileres.coberturas.agregar')}
          </Button>
        )}
      </div>

      {/* KPI Card */}
      <KPICard
        title={t('alquileres.coberturas.totalCoberturas')}
        value={data?.totalRegistros ?? 0}
        icon={Shield}
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
            titulo={t('alquileres.coberturas.titulo')}
            descripcion={Object.keys(filters).length > 0
              ? t('filters.noResults')
              : t('common.noData')
            }
            icono={<Shield className="w-16 h-16" />}
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
      <CoberturaModal
        isOpen={isFormOpen}
        cobertura={coberturaSeleccionada}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
      />

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('alquileres.coberturas.confirmarEliminar')}
        description={t('alquileres.coberturas.confirmarEliminarMsg', { nombre: coberturaSeleccionada?.nombre })}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
