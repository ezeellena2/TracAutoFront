import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Plus, AlertCircle, UserCheck, UserX, Upload, Download } from 'lucide-react';
import { Card, Button, PaginationControls, AdvancedFilterBar, FilterConfig, ImportExcelModal, ImportResultsModal } from '@/shared/ui';
import { ConfirmationModal } from '@/shared/ui/ConfirmationModal';
import { reportesApi } from '@/services/endpoints';
import type { ImportarExcelResponse } from '@/services/endpoints/reportes.api';
import { usePermissions, useTableFilters, useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import { downloadBlob } from '@/shared/utils/fileUtils';
import { useDriversPage } from '../hooks/useDriversPage';
import { DriversTable } from '../components/DriversTable';
import { CreateDriverModal } from '../components/CreateDriverModal';
import { EditDriverModal } from '../components/EditDriverModal';
import { AssignVehicleModal } from '../components/AssignVehicleModal';
import { AssignDeviceModal } from '../components/AssignDeviceModal';
import { ViewAssignmentsModal } from '../components/ViewAssignmentsModal';
import { GestionarComparticionModal } from '@/features/organization';
import type { TipoRecurso } from '@/shared/types/api';
import type { ConductorDto } from '../types';

const driverFiltersConfig: FilterConfig[] = [
  { key: 'buscar', label: 'Buscar / Search', type: 'text', placeholder: 'Nombre, DNI...' },
  { key: 'soloActivos', label: 'Solo Activos / Active Only', type: 'boolean' },
];

export function DriversPage() {
  const { t } = useTranslation();
  const { getErrorMessage } = useErrorHandler();
  const { can } = usePermissions();
  const canEdit = can('conductores:editar');
  const canCreate = can('conductores:crear');
  const canDelete = can('conductores:eliminar');

  // Filters hook
  const {
    filters,
    setFilter,
    clearFilters
  } = useTableFilters();

  // Sharing modal state
  const [conductorToShare, setConductorToShare] = useState<ConductorDto | null>(null);

  // Import modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportResultsModalOpen, setIsImportResultsModalOpen] = useState(false);
  const [importResults, setImportResults] = useState<ImportarExcelResponse | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  const {
    // Data
    conductoresData,
    vehiculos,
    dispositivos,
    assignments,
    isLoading,
    error,

    setNumeroPagina,
    setTamanoPagina,

    // Modal states
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isReactivateModalOpen,
    setIsReactivateModalOpen,
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
    isReactivating,
    isUnassigningVehicle,
    isUnassigningDevice,
    isLoadingAssignments,

    // Form states
    editingConductor,
    conductorToDelete,
    conductorToReactivate,
    conductorForAssignment,
    assignmentToUnassign,

    // Handlers
    handleOpenEdit,
    handleOpenDelete,
    handleDelete,
    handleOpenReactivate,
    handleReactivate,
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
  } = useDriversPage({ filters });

  // Import handler
  const handleImportDrivers = async (file: File) => {
    try {
      const results = await reportesApi.importConductoresExcel(file);
      setImportResults(results);
      setIsImportResultsModalOpen(true);
      await loadData();
      if (results.filasConErrores === 0) {
        toast.success(t('imports.results.allSuccess', { defaultValue: 'Todas las filas se importaron exitosamente' }));
      } else {
        toast.success(
          t('imports.results.importedCount', {
            defaultValue: 'Se importaron {{count}} filas',
            count: results.filasExitosas,
          })
        );
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  };

  // Export handler
  const handleExportDrivers = async () => {
    setIsExporting(true);
    try {
      // Exportar según los filtros aplicados (si hay filtro de soloActivos, usarlo; si no, exportar todos)
      const soloActivos = filters.soloActivos === 'true';
      const blob = await reportesApi.exportConductoresExcel(soloActivos);
      downloadBlob(blob, 'conductores.xlsx');
      toast.success(t('imports.exportSuccess', { defaultValue: 'Conductores exportados exitosamente' }));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsExporting(false);
    }
  };

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

  const hasActiveFilters = Object.keys(filters).length > 0;
  const showEmptyState = conductores.length === 0 && !hasActiveFilters;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="flex items-center justify-between"
        data-cr-key="conductores-page-header"
        data-route="/conductores"
        data-label="Página de Conductores - Header"
      >
        <div>
          <h1 className="text-2xl font-bold text-text">{t('drivers.title')}</h1>
          <p className="text-text-muted mt-1">{t('drivers.subtitle')}</p>
        </div>
        {canCreate && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportDrivers} isLoading={isExporting}>
              <Download size={16} className="mr-2" />
              {t('imports.export', { defaultValue: 'Exportar' })}
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload size={16} className="mr-2" />
              {t('imports.import', { defaultValue: 'Importar' })}
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              data-cr-key="conductores-page-crear"
              data-route="/conductores"
              data-label="Página de Conductores - Botón Crear"
            >
              <Plus size={16} className="mr-2" />
              {t('drivers.addDriver')}
            </Button>
          </div>
        )}
      </div>

      {showEmptyState ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <User size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">{t('drivers.empty')}</h3>
            <p className="text-text-muted text-center max-w-md mb-4">
              {t('drivers.emptyDescription')}
            </p>
            {canCreate && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                {t('drivers.addDriver')}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <User size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">{conductoresData?.totalRegistros ?? conductores.length}</p>
                  <p className="text-sm text-text-muted">{t('drivers.totalDrivers', { defaultValue: 'Total Conductores' })}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <UserCheck size={24} className="text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">
                    {conductoresData?.items.filter((c) => c.activo).length ?? 0}
                  </p>
                  <p className="text-sm text-text-muted">{t('drivers.activeDrivers', { defaultValue: 'Activos' })}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-error/10">
                  <UserX size={24} className="text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text">
                    {conductoresData?.items.filter((c) => !c.activo).length ?? 0}
                  </p>
                  <p className="text-sm text-text-muted">{t('drivers.inactiveDrivers', { defaultValue: 'Inactivos' })}</p>
                </div>
              </div>
            </Card>
          </div>

          <AdvancedFilterBar
            config={driverFiltersConfig}
            filters={filters}
            onFilterChange={setFilter}
            onClearFilters={clearFilters}
          />

          <div
            data-cr-key="conductores-table"
            data-route="/conductores"
            data-label="Tabla de Conductores"
          >
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
              onReactivate={handleOpenReactivate}
              onShare={setConductorToShare}
              formatDate={formatDate}
            />
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
          </Card>
          </div>
        </>
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
        description={t('drivers.confirmDeleteSoftDelete', { name: conductorToDelete?.nombreCompleto })}
        confirmText={t('drivers.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={isReactivateModalOpen}
        onClose={() => {
          setIsReactivateModalOpen(false);
          setActionMenuOpen(null);
        }}
        onConfirm={handleReactivate}
        title={t('drivers.reactivateDriver')}
        description={t('drivers.confirmReactivate', { name: conductorToReactivate?.nombreCompleto })}
        confirmText={t('drivers.reactivate')}
        cancelText={t('common.cancel')}
        variant="info"
        isLoading={isReactivating}
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

      {/* Modal de Gestión de Compartición */}
      {conductorToShare && (
        <GestionarComparticionModal
          isOpen={!!conductorToShare}
          onClose={() => setConductorToShare(null)}
          resourceId={conductorToShare.id}
          resourceType={2 as TipoRecurso} // TipoRecurso.Conductor
          resourceName={conductorToShare.nombreCompleto}
          onSuccess={loadData}
        />
      )}

      {/* Import Modal */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportDrivers}
        title={t('imports.importDrivers', { defaultValue: 'Importar Conductores' })}
        onDownloadTemplate={async () => {
          const blob = await reportesApi.downloadTemplateConductoresExcel();
          downloadBlob(blob, 'template_conductores.xlsx');
        }}
        templateLabel={t('imports.downloadDriverTemplate', { defaultValue: 'Template de Conductores' })}
      />

      {/* Import Results Modal */}
      {importResults && (
        <ImportResultsModal
          isOpen={isImportResultsModalOpen}
          onClose={() => {
            setIsImportResultsModalOpen(false);
            setImportResults(null);
          }}
          results={importResults}
          tipoImportacion={t('imports.importDrivers', { defaultValue: 'Conductores' })}
        />
      )}
    </div>
  );
}
