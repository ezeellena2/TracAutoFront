import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollText, Plus, Edit } from 'lucide-react';
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
import type { FilterConfig } from '@/shared/ui/AdvancedFilter/types';
import { usePermissions } from '@/hooks';
import { useContratosPage } from '../hooks/useContratosPage';
import { CreatePlantillaModal } from '../components/CreatePlantillaModal';
import { EditPlantillaModal } from '../components/EditPlantillaModal';
import type { PlantillaContratoDto } from '../types/contrato';

export function ContratosPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();

  const {
    plantillasData,
    plantillas,
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
    plantillaSeleccionada,
    openEdit,
    handleSuccess,
  } = useContratosPage();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtersConfig: FilterConfig[] = useMemo(() => [
    {
      key: 'buscar',
      label: t('alquileres.contratos.filtros.buscar'),
      type: 'text',
      placeholder: t('alquileres.contratos.filtros.buscarPlaceholder'),
    },
    {
      key: 'soloActivas',
      label: t('alquileres.contratos.filtros.soloActivas'),
      type: 'boolean',
    },
  ], [t]);

  const columns = useMemo(() => [
    {
      key: 'nombre',
      header: t('alquileres.contratos.tabla.nombre'),
      render: (p: PlantillaContratoDto) => (
        <div>
          <p className="font-medium text-text">{p.nombre}</p>
        </div>
      ),
    },
    {
      key: 'version',
      header: t('alquileres.contratos.tabla.version'),
      render: (p: PlantillaContratoDto) => (
        <span className="text-text-muted">v{p.version}</span>
      ),
    },
    {
      key: 'esDefault',
      header: t('alquileres.contratos.tabla.esDefault'),
      render: (p: PlantillaContratoDto) => (
        p.esDefault ? (
          <Badge variant="info">{t('alquileres.contratos.tabla.esDefault')}</Badge>
        ) : null
      ),
    },
    {
      key: 'activa',
      header: t('alquileres.contratos.tabla.activa'),
      render: (p: PlantillaContratoDto) => (
        <Badge variant={p.activa ? 'success' : 'error'}>
          {p.activa ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      key: 'fechaActualizacion',
      header: t('alquileres.contratos.tabla.fechaActualizacion'),
      render: (p: PlantillaContratoDto) => (
        <span className="text-text-muted text-sm">
          {p.fechaActualizacion.split('T')[0]}
        </span>
      ),
      mobileHidden: true,
    },
    {
      key: 'acciones',
      header: t('alquileres.contratos.tabla.acciones'),
      render: (p: PlantillaContratoDto) => {
        if (!can('alquileres:configurar')) return null;
        return (
          <ActionMenu
            isOpen={openMenuId === p.id}
            onToggle={() => setOpenMenuId(prev => prev === p.id ? null : p.id)}
            onClose={() => setOpenMenuId(null)}
          >
            <button
              onClick={() => { setOpenMenuId(null); openEdit(p); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-border transition-colors"
            >
              <Edit size={14} />
              {t('common.edit')}
            </button>
          </ActionMenu>
        );
      },
    },
  ], [t, can, openMenuId, openEdit]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('alquileres.contratos.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.contratos.subtitulo')}</p>
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
          <h1 className="text-2xl font-bold text-text">{t('alquileres.contratos.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.contratos.subtitulo')}</p>
        </div>
        {can('alquileres:configurar') && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} className="mr-2" />
            {t('alquileres.contratos.crear')}
          </Button>
        )}
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title={t('alquileres.contratos.totalPlantillas')}
          value={plantillasData?.totalRegistros ?? 0}
          icon={ScrollText}
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
        {plantillas.length === 0 && !isLoading ? (
          <EstadoVacio
            titulo={t('alquileres.contratos.titulo')}
            descripcion={Object.keys(filters).length > 0
              ? t('filters.noResults')
              : t('common.noData')
            }
            icono={<ScrollText className="w-16 h-16" />}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={plantillas}
              keyExtractor={(p) => p.id}
              isLoading={isLoading}
            />
            {plantillasData && plantillasData.totalRegistros > 0 && (
              <PaginationControls
                paginaActual={plantillasData.paginaActual}
                totalPaginas={plantillasData.totalPaginas}
                tamanoPagina={plantillasData.tamanoPagina}
                totalRegistros={plantillasData.totalRegistros}
                onPageChange={setNumeroPagina}
                onPageSizeChange={setTamanoPagina}
                disabled={isLoading}
              />
            )}
          </>
        )}
      </Card>

      {/* Modales */}
      <CreatePlantillaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleSuccess}
      />

      <EditPlantillaModal
        isOpen={isEditOpen}
        plantillaId={plantillaSeleccionada?.id ?? null}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
