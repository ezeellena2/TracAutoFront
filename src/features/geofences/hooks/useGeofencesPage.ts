/**
 * Hook para manejar la lógica de la página de Geofences.
 * Sigue el mismo patrón que useDriversPage.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { geofencesApi } from '../api';
import { vehiculosApi } from '@/services/endpoints/vehiculos.api';
import { usePaginationParams, useErrorHandler } from '@/hooks';
import { useLocalizationStore } from '@/store/localization.store';
import { formatDate } from '@/shared/utils/dateFormatter';
import { toast } from '@/store/toast.store';
import { SyncStatus } from '../types';
import type {
  GeofenceDto,
  CreateGeofenceCommand,
  UpdateGeofenceCommand,
  ListaPaginada,
} from '../types';

export interface VehiculoSimple {
  id: string;
  patente: string;
}

export interface UseGeofencesPageProps {
  filters?: Record<string, any>;
}

export function useGeofencesPage({ filters = {} }: UseGeofencesPageProps = {}) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();

  // ================================
  // DATA STATE
  // ================================
  const [geofencesData, setGeofencesData] = useState<ListaPaginada<GeofenceDto> | null>(null);
  const [vehiculos, setVehiculos] = useState<VehiculoSimple[]>([]);
  const [isLoadingVehiculos] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ================================
  // PAGINATION
  // ================================
  const {
    setNumeroPagina,
    setTamanoPagina,
    params: paginationParams,
  } = usePaginationParams({
    initialPageSize: 10,
    totalPaginas: geofencesData?.totalPaginas,
  });

  // ================================
  // MODAL STATES
  // ================================
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingGeofence, setEditingGeofence] = useState<GeofenceDto | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [geofenceToDelete, setGeofenceToDelete] = useState<GeofenceDto | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [geofenceForAssign, setGeofenceForAssign] = useState<GeofenceDto | null>(null);

  // Action menu state
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // ================================
  // LOAD DATA
  // ================================
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendParams: any = {
        ...paginationParams,
      };

      if (filters.buscar) backendParams.buscar = filters.buscar;
      if (filters.soloActivas !== undefined && filters.soloActivas !== '') {
        backendParams.soloActivas = filters.soloActivas === 'true' || filters.soloActivas === true;
      } else {
        backendParams.soloActivas = true;
      }

      const [geofencesResult, vehiculosResult] = await Promise.all([
        geofencesApi.listar(backendParams),
        vehiculosApi.getVehiculos({ soloActivos: true, tamanoPagina: 100, soloPropios: true }),
      ]);

      setGeofencesData(geofencesResult);
      setVehiculos(vehiculosResult.items.map((v) => ({ id: v.id, patente: v.patente })));
    } catch (e) {
      const parsed = handleApiError(e, { showToast: false });
      setError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  }, [paginationParams, filters, handleApiError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Ajustar automáticamente si la página actual excede el total de páginas
  useEffect(() => {
    if (
      geofencesData &&
      geofencesData.paginaActual > geofencesData.totalPaginas &&
      geofencesData.totalPaginas > 0
    ) {
      setNumeroPagina(geofencesData.totalPaginas);
    }
  }, [geofencesData, setNumeroPagina]);

  // ================================
  // MODAL HANDLERS
  // ================================
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingGeofence(null);
    setIsCreateEditOpen(true);
  };

  const handleOpenEdit = (geofence: GeofenceDto) => {
    setModalMode('edit');
    setEditingGeofence(geofence);
    setIsCreateEditOpen(true);
    setActionMenuOpen(null);
  };

  const handleCloseModal = () => {
    setIsCreateEditOpen(false);
    setEditingGeofence(null);
  };

  const handleSubmitModal = async (data: CreateGeofenceCommand | UpdateGeofenceCommand) => {
    if (modalMode === 'create') {
      await geofencesApi.crear(data as CreateGeofenceCommand);
      toast.success(t('geofences.creadaExito', 'Geozona creada exitosamente'));
    } else {
      const { id, ...rest } = data as UpdateGeofenceCommand;
      await geofencesApi.actualizar(id, rest);
      toast.success(t('geofences.actualizadaExito', 'Geozona actualizada exitosamente'));
    }
    await loadData();
  };

  // ================================
  // DELETE HANDLERS
  // ================================
  const handleOpenDelete = (geofence: GeofenceDto) => {
    setGeofenceToDelete(geofence);
    setIsDeleteModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleDelete = async () => {
    if (!geofenceToDelete) return;

    setIsDeleting(true);
    try {
      await geofencesApi.eliminar(geofenceToDelete.id);
      toast.success(t('geofences.eliminadaExito', 'Geozona eliminada exitosamente'));
      setIsDeleteModalOpen(false);
      setGeofenceToDelete(null);
      await loadData();
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // ================================
  // ASSIGN HANDLERS
  // ================================
  const handleOpenAssign = (geofence: GeofenceDto) => {
    setGeofenceForAssign(geofence);
    setIsAssignModalOpen(true);
    setActionMenuOpen(null);
  };

  // ================================
  // COMPUTED STATS
  // ================================
  const geofences = geofencesData?.items ?? [];
  const stats = {
    total: geofencesData?.totalRegistros ?? geofences.length,
    sincronizadas: geofences.filter((g) => g.syncStatus === SyncStatus.Synced).length,
    conError: geofences.filter((g) => g.syncStatus === SyncStatus.Error).length,
    pendientes: geofences.filter((g) => g.syncStatus === SyncStatus.PendingCreate).length,
  };

  // ================================
  // FORMATTERS
  // ================================
  const formatDateFn = (dateStr: string) => {
    const preferences = useLocalizationStore.getState().preferences;
    const culture = preferences?.culture ?? 'es-AR';
    const timeZoneId = preferences?.timeZoneId ?? 'America/Argentina/Buenos_Aires';
    return formatDate(dateStr, culture, timeZoneId);
  };

  // ================================
  // RETURN
  // ================================
  return {
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
    isCreateEditOpen,
    modalMode,
    editingGeofence,
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
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleSubmitModal,
    handleOpenDelete,
    handleDelete,
    handleOpenAssign,
    loadData,

    // Formatters
    formatDate: formatDateFn,
  };
}
