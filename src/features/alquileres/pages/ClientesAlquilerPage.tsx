import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Contact, Plus, Eye, Edit } from 'lucide-react';
import {
  Card,
  Button,
  Table,
  KPICard,
  PaginationControls,
  AdvancedFilterBar,
  EstadoVacio,
  EstadoError,
  ActionMenu,
} from '@/shared/ui';
import type { FilterConfig } from '@/shared/ui/AdvancedFilter/types';
import { usePermissions, useLocalization } from '@/hooks';
import { formatDate } from '@/shared/utils/dateFormatter';
import { useClientesPage } from '../hooks/useClientesPage';
import { CreateClienteModal } from '../components/CreateClienteModal';
import { EditClienteModal } from '../components/EditClienteModal';
import { ClienteDetalleModal } from '../components/ClienteDetalleModal';
import type { ClienteAlquilerDto } from '../types/cliente';

export function ClientesAlquilerPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { culture, timeZoneId } = useLocalization();

  const {
    clientesData,
    clientes,
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
    clienteSeleccionado,
    openEdit,
    isDetailOpen,
    setIsDetailOpen,
    openDetail,
    handleSuccess,
  } = useClientesPage();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Configuración de filtros
  const filtersConfig: FilterConfig[] = useMemo(() => [
    {
      key: 'buscar',
      label: t('alquileres.clientes.filtros.buscar'),
      type: 'text',
      placeholder: t('alquileres.clientes.filtros.buscarPlaceholder'),
    },
  ], [t]);

  // Columnas de la tabla
  const columns = useMemo(() => [
    {
      key: 'nombre',
      header: t('alquileres.clientes.tabla.nombre'),
      render: (c: ClienteAlquilerDto) => (
        <div>
          <p className="font-medium text-text">{c.nombre} {c.apellido}</p>
          <p className="text-xs text-text-muted truncate max-w-[200px]">{c.email}</p>
        </div>
      ),
    },
    {
      key: 'telefono',
      header: t('alquileres.clientes.tabla.telefono'),
      render: (c: ClienteAlquilerDto) => (
        <span className="text-text-muted">{c.telefono || '—'}</span>
      ),
      mobileHidden: true,
    },
    {
      key: 'documento',
      header: t('alquileres.clientes.tabla.documento'),
      render: (c: ClienteAlquilerDto) => (
        <div>
          <span className="text-text">{t(`alquileres.clientes.tiposDocumento.${c.tipoDocumento}`)}</span>
          <span className="text-text-muted ml-1">{c.numeroDocumento}</span>
        </div>
      ),
    },
    {
      key: 'fechaRegistro',
      header: t('alquileres.clientes.tabla.fechaRegistro'),
      render: (c: ClienteAlquilerDto) => (
        <span className="text-text-muted">{formatDate(c.fechaRegistro, culture, timeZoneId)}</span>
      ),
      mobileHidden: true,
    },
    {
      key: 'acciones',
      header: t('alquileres.clientes.tabla.acciones'),
      render: (c: ClienteAlquilerDto) => {
        const canEdit = can('alquileres:editar');
        return (
          <ActionMenu
            isOpen={openMenuId === c.id}
            onToggle={() => setOpenMenuId(prev => prev === c.id ? null : c.id)}
            onClose={() => setOpenMenuId(null)}
          >
            <button
              onClick={() => { setOpenMenuId(null); openDetail(c); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-border transition-colors"
            >
              <Eye size={14} />
              {t('alquileres.clientes.tabla.verDetalle')}
            </button>
            {canEdit && (
              <button
                onClick={() => { setOpenMenuId(null); openEdit(c); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-border transition-colors"
              >
                <Edit size={14} />
                {t('common.edit')}
              </button>
            )}
          </ActionMenu>
        );
      },
    },
  ], [t, can, openMenuId, openDetail, openEdit]);

  // Estado de error
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('alquileres.clientes.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.clientes.subtitulo')}</p>
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
          <h1 className="text-2xl font-bold text-text">{t('alquileres.clientes.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.clientes.subtitulo')}</p>
        </div>
        {can('alquileres:crear') && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} className="mr-2" />
            {t('alquileres.clientes.crear')}
          </Button>
        )}
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title={t('alquileres.clientes.totalClientes')}
          value={clientesData?.totalRegistros ?? 0}
          icon={Contact}
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
        {clientes.length === 0 && !isLoading ? (
          <EstadoVacio
            titulo={t('alquileres.clientes.titulo')}
            descripcion={Object.keys(filters).length > 0
              ? t('filters.noResults')
              : t('common.noData')
            }
            icono={<Contact className="w-16 h-16" />}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={clientes}
              keyExtractor={(c) => c.id}
              isLoading={isLoading}
            />
            {clientesData && clientesData.totalRegistros > 0 && (
              <PaginationControls
                paginaActual={clientesData.paginaActual}
                totalPaginas={clientesData.totalPaginas}
                tamanoPagina={clientesData.tamanoPagina}
                totalRegistros={clientesData.totalRegistros}
                onPageChange={setNumeroPagina}
                onPageSizeChange={setTamanoPagina}
                disabled={isLoading}
              />
            )}
          </>
        )}
      </Card>

      {/* Modales */}
      <CreateClienteModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleSuccess}
      />

      <EditClienteModal
        isOpen={isEditOpen}
        clienteId={clienteSeleccionado?.id ?? null}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleSuccess}
      />

      <ClienteDetalleModal
        isOpen={isDetailOpen}
        clienteId={clienteSeleccionado?.id ?? null}
        onClose={() => setIsDetailOpen(false)}
        onEdit={() => {
          setIsDetailOpen(false);
          if (clienteSeleccionado) openEdit(clienteSeleccionado);
        }}
      />
    </div>
  );
}
