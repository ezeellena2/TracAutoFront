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
            <h1 className="text-2xl font-bold text-text">Conductores</h1>
            <p className="text-text-muted mt-1">Gestión de conductores de la organización</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-text-muted mt-4">Cargando conductores...</p>
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
            <h1 className="text-2xl font-bold text-text">Conductores</h1>
            <p className="text-text-muted mt-1">Gestión de conductores de la organización</p>
          </div>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-error mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Error al cargar conductores</h3>
            <p className="text-text-muted mb-6 text-center max-w-md">{error}</p>
            <Button onClick={loadData}>Reintentar</Button>
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
          <h1 className="text-2xl font-bold text-text">Conductores</h1>
          <p className="text-text-muted mt-1">Gestión de conductores de la organización</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Agregar Conductor
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
            <h3 className="text-lg font-semibold text-text mb-2">Sin conductores</h3>
            <p className="text-text-muted text-center max-w-md mb-4">
              {buscar || soloActivos
                ? 'No se encontraron conductores con los filtros aplicados.'
                : 'No hay conductores registrados para tu organización.'}
            </p>
            {canCreate && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                Agregar Conductor
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
        title="Eliminar Conductor"
        description={`¿Estás seguro de que deseas eliminar al conductor "${conductorToDelete?.nombreCompleto}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
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
        title="Desasignar Vehículo"
        description={`¿Estás seguro de desasignar el vehículo "${assignmentToUnassign?.name}" de este conductor?`}
        confirmText="Desasignar"
        cancelText="Cancelar"
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
        title="Desasignar Dispositivo"
        description={`¿Estás seguro de desasignar el dispositivo "${assignmentToUnassign?.name}" de este conductor?`}
        confirmText="Desasignar"
        cancelText="Cancelar"
        variant="warning"
        isLoading={isUnassigningDevice}
      />
    </div>
  );
}
