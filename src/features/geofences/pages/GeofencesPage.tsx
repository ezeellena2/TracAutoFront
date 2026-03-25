import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Map, MapPin, Plus } from 'lucide-react';
import { AdvancedFilterBar, Button, Card, PaginationControls, type FilterConfig } from '@/shared/ui';
import { ConfirmationModal } from '@/shared/ui/ConfirmationModal';
import { usePermissions, useTableFilters } from '@/hooks';
import { useAuthStore } from '@/store';
import { AssignVehiculosModal } from '../components/AssignVehiculosModal';
import { GeofencesTable } from '../components/GeofencesTable';
import { useGeofencesPage } from '../hooks/useGeofencesPage';
import type { GeofenceDto } from '../types';

const getGeofenceFiltersConfig = (
  t: (key: string, options?: Record<string, unknown>) => string,
): FilterConfig[] => [
  { key: 'buscar', label: t('geofences.buscar'), type: 'text', placeholder: t('geofences.buscarPlaceholder') },
  { key: 'soloActivas', label: t('geofences.soloActivas'), type: 'boolean' },
];

export function GeofencesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { can } = usePermissions();
  const canEdit = can('geofences:editar');
  const canCreate = can('geofences:crear');
  const canDelete = can('geofences:eliminar');
  const isPersonalContext =
    user?.contextoActivo?.tipo === 'Personal' ||
    (!!user && !user.organizationId);
  const pageTitle = isPersonalContext ? 'Mis geozonas' : t('geofences.titulo');
  const pageSubtitle = isPersonalContext
    ? t('geofences.personal.subtitle', { defaultValue: 'Crea geozonas propias y asignalas solo a vehiculos del mismo contexto personal.' })
    : t('geofences.subtitulo');
  const emptyDescription = isPersonalContext
    ? t('geofences.personal.emptyDescription', { defaultValue: 'Todavia no creaste geozonas personales. Puedes usarlas para organizar y monitorear recorridos de tus vehiculos propios.' })
    : t('geofences.sinGeofencesDescripcion');
  const { filters, setFilter, clearFilters } = useTableFilters();
  const {
    geofencesData,
    geofences,
    vehiculos,
    isLoadingVehiculos,
    isLoading,
    error,
    stats,
    setNumeroPagina,
    setTamanoPagina,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    geofenceToDelete,
    isAssignModalOpen,
    setIsAssignModalOpen,
    geofenceForAssign,
    actionMenuOpen,
    setActionMenuOpen,
    handleOpenDelete,
    handleDelete,
    handleOpenAssign,
    loadData,
    formatDate,
  } = useGeofencesPage({ filters });

  const handleCreate = () => navigate('/geozonas/crear');
  const handleEdit = (geofence: GeofenceDto) => navigate(`/geozonas/${geofence.id}/editar`);

  if (isLoading && !geofencesData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{pageTitle}</h1>
            <p className="mt-1 text-text-muted">{pageSubtitle}</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
              <p className="mt-4 text-text-muted">{t('geofences.cargando')}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error && !geofencesData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{pageTitle}</h1>
            <p className="mt-1 text-text-muted">{pageSubtitle}</p>
          </div>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="mb-4 text-error" />
            <h3 className="mb-2 text-lg font-semibold text-text">{t('geofences.errorCargar')}</h3>
            <p className="mb-6 max-w-md text-center text-text-muted">{error}</p>
            <Button onClick={loadData}>{t('common.retry')}</Button>
          </div>
        </Card>
      </div>
    );
  }

  const hasActiveFilters = Object.keys(filters).length > 0;
  const showEmptyState = geofences.length === 0 && !hasActiveFilters;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{pageTitle}</h1>
          <p className="mt-1 text-text-muted">{pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/geozonas/mapa')}>
            <Map size={16} className="mr-2" />
            {t('geofences.verMapa')}
          </Button>
          {canCreate && (
            <Button onClick={handleCreate}>
              <Plus size={16} className="mr-2" />
              {t('geofences.crearGeozona')}
            </Button>
          )}
        </div>
      </div>

      {showEmptyState ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <MapPin size={48} className="mb-4 text-text-muted" />
            <h3 className="mb-2 text-lg font-semibold text-text">{t('geofences.sinGeofences')}</h3>
            <p className="mb-4 max-w-md text-center text-text-muted">{emptyDescription}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {canCreate && (
                <Button onClick={handleCreate}>
                  <Plus size={16} className="mr-2" />
                  {t('geofences.crearGeozona')}
                </Button>
              )}
              <RouterLink
                to="/mapa"
                className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-4 py-2 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
              >
                Ver mapa
              </RouterLink>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <MapPin size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{stats.total}</p>
                  <p className="text-sm text-text-muted">{t('geofences.kpi.total')}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-success/10 p-3">
                  <CheckCircle size={24} className="text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{stats.sincronizadas}</p>
                  <p className="text-sm text-text-muted">
                    {t('geofences.kpi.sincronizadas')} <span className="text-xs opacity-60">({t('common.page')})</span>
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-error/10 p-3">
                  <AlertTriangle size={24} className="text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{stats.conError}</p>
                  <p className="text-sm text-text-muted">
                    {t('geofences.kpi.conError')} <span className="text-xs opacity-60">({t('common.page')})</span>
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-warning/10 p-3">
                  <Clock size={24} className="text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{stats.pendientes}</p>
                  <p className="text-sm text-text-muted">
                    {t('geofences.kpi.pendientes')} <span className="text-xs opacity-60">({t('common.page')})</span>
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <AdvancedFilterBar
            config={getGeofenceFiltersConfig(t)}
            filters={filters}
            onFilterChange={setFilter}
            onClearFilters={clearFilters}
          />

          <div>
            <Card padding="none" className="overflow-visible">
              <GeofencesTable
                geofences={geofences}
                canEdit={canEdit}
                canDelete={canDelete}
                actionMenuOpen={actionMenuOpen}
                onActionMenuToggle={setActionMenuOpen}
                onEdit={handleEdit}
                onDelete={handleOpenDelete}
                onAssignVehiculos={handleOpenAssign}
                formatDate={formatDate}
              />
              {geofencesData && geofencesData.totalRegistros > 0 && (
                <PaginationControls
                  paginaActual={geofencesData.paginaActual}
                  totalPaginas={geofencesData.totalPaginas}
                  tamanoPagina={geofencesData.tamanoPagina}
                  totalRegistros={geofencesData.totalRegistros}
                  onPageChange={setNumeroPagina}
                  onPageSizeChange={setTamanoPagina}
                  disabled={isLoading}
                />
              )}
            </Card>
          </div>
        </>
      )}

      <AssignVehiculosModal
        isOpen={isAssignModalOpen}
        geofence={geofenceForAssign ?? undefined}
        vehiculos={vehiculos}
        isLoadingVehiculos={isLoadingVehiculos}
        onClose={() => {
          setIsAssignModalOpen(false);
          setActionMenuOpen(null);
        }}
        onAssigned={loadData}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActionMenuOpen(null);
        }}
        onConfirm={handleDelete}
        title={t('geofences.confirmarEliminar')}
        description={t('geofences.confirmarEliminarMsg', {
          nombre: geofenceToDelete?.nombre,
        })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

