/**
 * Página principal de Geozonas (Geofences).
 * Sigue el mismo patrón de layout y UX que DriversPage y VehiclesPage.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, AlertCircle, CheckCircle, AlertTriangle, Clock, Map } from 'lucide-react';
import { Card, Button, PaginationControls, AdvancedFilterBar, FilterConfig } from '@/shared/ui';
import { ConfirmationModal } from '@/shared/ui/ConfirmationModal';
import { usePermissions, useTableFilters } from '@/hooks';
import { useGeofencesPage } from '../hooks/useGeofencesPage';
import { GeofencesTable } from '../components/GeofencesTable';
import { AssignVehiculosModal } from '../components/AssignVehiculosModal';
import type { GeofenceDto } from '../types';

const geofenceFiltersConfig: FilterConfig[] = [
  { key: 'buscar', label: 'Buscar / Search', type: 'text', placeholder: 'Nombre, descripción...' },
  { key: 'soloActivas', label: 'Solo Activas / Active Only', type: 'boolean' },
];

export function GeofencesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canEdit = can('geofences:editar');
  const canCreate = can('geofences:crear');
  const canDelete = can('geofences:eliminar');

  // Filters hook
  const {
    filters,
    setFilter,
    clearFilters,
  } = useTableFilters();

  const {
    // Data
    geofencesData,
    geofences,
    vehiculos,
    isLoadingVehiculos,
    isLoading,
    error,
    stats,

    // Pagination
    setNumeroPagina,
    setTamanoPagina,

    // Modal states
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    geofenceToDelete,
    isAssignModalOpen,
    setIsAssignModalOpen,
    geofenceForAssign,

    // Action menu
    actionMenuOpen,
    setActionMenuOpen,

    // Handlers
    handleOpenDelete,
    handleDelete,
    handleOpenAssign,
    loadData,

    // Formatters
    formatDate,
  } = useGeofencesPage({ filters });

  // Navegación en vez de modal
  const handleCreate = () => navigate('/geozonas/crear');
  const handleEdit = (geofence: GeofenceDto) => navigate(`/geozonas/${geofence.id}/editar`);

  // Loading state
  if (isLoading && !geofencesData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('geofences.titulo')}</h1>
            <p className="text-text-muted mt-1">{t('geofences.subtitulo')}</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-text-muted mt-4">{t('geofences.cargando', 'Cargando geozonas...')}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !geofencesData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('geofences.titulo')}</h1>
            <p className="text-text-muted mt-1">{t('geofences.subtitulo')}</p>
          </div>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-error mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{t('geofences.errorCargar')}</h3>
            <p className="text-text-muted mb-6 text-center max-w-md">{error}</p>
            <Button onClick={loadData}>{t('common.retry', 'Reintentar')}</Button>
          </div>
        </Card>
      </div>
    );
  }

  const hasActiveFilters = Object.keys(filters).length > 0;
  const showEmptyState = geofences.length === 0 && !hasActiveFilters;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="flex items-center justify-between"
        data-cr-key="geofences-page-header"
        data-route="/geozonas"
        data-label="Página de Geozonas - Header"
      >
        <div>
          <h1 className="text-2xl font-bold text-text">{t('geofences.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('geofences.subtitulo')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/geozonas/mapa')}
            data-cr-key="geofences-page-mapa"
            data-route="/geozonas"
            data-label="Página de Geozonas - Botón Mapa"
          >
            <Map size={16} className="mr-2" />
            {t('geofences.verMapa', 'Ver Mapa')}
          </Button>
          {canCreate && (
            <Button
              onClick={handleCreate}
              data-cr-key="geofences-page-crear"
              data-route="/geozonas"
              data-label="Página de Geozonas - Botón Crear"
            >
              <Plus size={16} className="mr-2" />
              {t('geofences.crearGeozona')}
            </Button>
          )}
        </div>
      </div>

      {showEmptyState ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <MapPin size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">
              {t('geofences.sinGeofences')}
            </h3>
            <p className="text-text-muted text-center max-w-md mb-4">
              {t('geofences.sinGeofencesDescripcion', 'Crea tu primera geozona para comenzar a monitorear zonas geográficas.')}
            </p>
            {canCreate && (
              <Button onClick={handleCreate}>
                <Plus size={16} className="mr-2" />
                {t('geofences.crearGeozona')}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
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
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle size={24} className="text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{stats.sincronizadas}</p>
                  <p className="text-sm text-text-muted">{t('geofences.kpi.sincronizadas')}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-error/10">
                  <AlertTriangle size={24} className="text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{stats.conError}</p>
                  <p className="text-sm text-text-muted">{t('geofences.kpi.conError')}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Clock size={24} className="text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{stats.pendientes}</p>
                  <p className="text-sm text-text-muted">{t('geofences.kpi.pendientes')}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filtros */}
          <AdvancedFilterBar
            config={geofenceFiltersConfig}
            filters={filters}
            onFilterChange={setFilter}
            onClearFilters={clearFilters}
          />

          {/* Tabla */}
          <div
            data-cr-key="geofences-table"
            data-route="/geozonas"
            data-label="Tabla de Geozonas"
          >
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

      {/* Modal Asignar Vehículos */}
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

      {/* Modal Confirmación Eliminar */}
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
