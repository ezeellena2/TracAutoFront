import { useTranslation } from 'react-i18next';
import { User, Plus, AlertCircle } from 'lucide-react';
import { Card, Button, ConfirmationModal, PaginationControls } from '@/shared/ui';
import { usePermissions } from '@/hooks';
import { useDriversPage } from '../hooks/useDriversPage';
import { DriversFilters } from '../components/DriversFilters';
import { DriversTable } from '../components/DriversTable';
import { CreateDriverModal } from '../components/CreateDriverModal';
import { EditDriverModal } from '../components/EditDriverModal';
import { AssignVehicleModal } from '../components/AssignVehicleModal';
import { AssignDeviceModal } from '../components/AssignDeviceModal';
import { ViewAssignmentsModal } from '../components/ViewAssignmentsModal';

export function DriversPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canEdit = can('conductores:editar');
  const canCreate = can('conductores:crear');
  const canDelete = can('conductores:eliminar');

  const {
    // Data
    conductoresData,
    vehiculos,
    dispositivos,
    assignments,
    isLoading,
    error,

    // Filters
    buscar,
    setBuscar,
    soloActivos,
    setSoloActivos,
    setNumeroPagina,
    setTamanoPagina,

    // Modal states
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isAssignVehicleModalOpen,
    setIsAssignVehicleModalOpen,
    isAssignDeviceModalOpen,
    setIsAssignDeviceModalOpen,
    isViewAssignmentsModalOpen,
    setIsViewAssignmentsModalOpen,
    isUnassignVehicleModalOpen,
    setIsUnassignVehicleModalOpen,
    isUnassignDeviceModalOpen,
    setIsUnassignDeviceModalOpen,

    // Loading states
    isDeleting,
    isUnassigningVehicle,
    isUnassigningDevice,
    isLoadingAssignments,

    // Form states
    editingConductor,
    conductorToDelete,
    conductorForAssignment,
    assignmentToUnassign,

    // Handlers
    handleOpenEdit,
    handleOpenDelete,
    handleDelete,
    handleOpenAssignVehicle,
    handleOpenAssignDevice,
    handleOpenViewAssignments,
    handleOpenUnassignVehicle,
    handleUnassignVehicle,
    handleOpenUnassignDevice,
    handleUnassignDevice,
    loadData,

    // Action menu
    actionMenuOpen,
    setActionMenuOpen,

    // Helpers
    formatDate,
    formatDateTime,
  } = useDriversPage();

  const conductores = conductoresData?.items ?? [];

  // Loading state
  if (isLoading && !conductoresData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('drivers.title')}</h1>
            <p className="text-text-muted mt-1">{t('drivers.subtitle')}</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-text-muted mt-4">{t('drivers.loading')}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !conductoresData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{t('drivers.title')}</h1>
            <p className="text-text-muted mt-1">{t('drivers.subtitle')}</p>
          </div>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-error mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{t('drivers.loadError')}</h3>
            <p className="text-text-muted mb-6 text-center max-w-md">{error}</p>
            <Button onClick={loadData}>{t('drivers.retry')}</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('drivers.title')}</h1>
          <p className="text-text-muted mt-1">{t('drivers.subtitle')}</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            {t('drivers.addDriver')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <DriversFilters
        buscar={buscar}
        onBuscarChange={setBuscar}
        soloActivos={soloActivos}
        onSoloActivosChange={setSoloActivos}
      />

      {/* Table */}
      {conductores.length > 0 ? (
        <>
          <Card padding="none" className="overflow-visible">
            <DriversTable
              conductores={conductores}
              canEdit={canEdit}
              canDelete={canDelete}
              actionMenuOpen={actionMenuOpen}
              onActionMenuToggle={setActionMenuOpen}
              onEdit={handleOpenEdit}
              onViewAssignments={handleOpenViewAssignments}
              onAssignVehicle={handleOpenAssignVehicle}
              onAssignDevice={handleOpenAssignDevice}
              onDelete={handleOpenDelete}
              formatDate={formatDate}
            />
          </Card>
          {conductoresData && conductoresData.totalRegistros > 0 && (
            <PaginationControls
              paginaActual={conductoresData.paginaActual}
              totalPaginas={conductoresData.totalPaginas}
              tamanoPagina={conductoresData.tamanoPagina}
              totalRegistros={conductoresData.totalRegistros}
              onPageChange={setNumeroPagina}
              onPageSizeChange={setTamanoPagina}
              disabled={isLoading}
            />
          )}
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <User size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{t('drivers.empty')}</h3>
            <p className="text-text-muted text-center max-w-md mb-4">
              {buscar || soloActivos
                ? t('drivers.emptyFiltered')
                : t('drivers.emptyDescription')}
            </p>
            {canCreate && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                {t('drivers.addDriver')}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Modals */}
      <CreateDriverModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadData}
      />

      <EditDriverModal
        isOpen={isEditModalOpen}
        conductor={editingConductor}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={loadData}
      />

      <AssignVehicleModal
        isOpen={isAssignVehicleModalOpen}
        conductor={conductorForAssignment}
        vehiculos={vehiculos}
        onClose={() => {
          setIsAssignVehicleModalOpen(false);
          setActionMenuOpen(null);
        }}
        onSuccess={loadData}
      />

      <AssignDeviceModal
        isOpen={isAssignDeviceModalOpen}
        conductor={conductorForAssignment}
        dispositivos={dispositivos}
        onClose={() => {
          setIsAssignDeviceModalOpen(false);
          setActionMenuOpen(null);
        }}
        onSuccess={loadData}
      />

      <ViewAssignmentsModal
        isOpen={isViewAssignmentsModalOpen}
        conductor={conductorForAssignment}
        vehiculosAssignments={assignments.vehiculos}
        dispositivosAssignments={assignments.dispositivos}
        isLoading={isLoadingAssignments}
        canEdit={canEdit}
        formatDateTime={formatDateTime}
        onClose={() => {
          setIsViewAssignmentsModalOpen(false);
          setActionMenuOpen(null);
        }}
        onUnassignVehicle={handleOpenUnassignVehicle}
        onUnassignDevice={handleOpenUnassignDevice}
      />

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setActionMenuOpen(null);
        }}
        onConfirm={handleDelete}
        title={t('drivers.deleteDriver')}
        description={t('drivers.confirmDelete', { name: conductorToDelete?.nombreCompleto })}
        confirmText={t('drivers.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={isUnassignVehicleModalOpen}
        onClose={() => {
          setIsUnassignVehicleModalOpen(false);
          setActionMenuOpen(null);
        }}
        onConfirm={handleUnassignVehicle}
        title={t('drivers.unassignVehicle')}
        description={t('drivers.confirmUnassignVehicle', { name: assignmentToUnassign?.name })}
        confirmText={t('drivers.unassignVehicle')}
        cancelText={t('common.cancel')}
        variant="warning"
        isLoading={isUnassigningVehicle}
      />

      <ConfirmationModal
        isOpen={isUnassignDeviceModalOpen}
        onClose={() => {
          setIsUnassignDeviceModalOpen(false);
          setActionMenuOpen(null);
        }}
        onConfirm={handleUnassignDevice}
        title={t('drivers.unassignDevice')}
        description={t('drivers.confirmUnassignDevice', { name: assignmentToUnassign?.name })}
        confirmText={t('drivers.unassignDevice')}
        cancelText={t('common.cancel')}
        variant="warning"
        isLoading={isUnassigningDevice}
      />
    </div>
  );
}
