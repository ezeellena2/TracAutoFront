/**
 * Hook para manejar la lógica de Geofences
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGeofencesStore } from '../store/geofences.store';
import { geofencesApi } from '../api';
import { vehiculosApi } from '@/services/endpoints/vehiculos.api';
import { useToastStore } from '@/store/toast.store';
import {
  SyncStatus,
  GEOFENCES_PAGE_SIZE,
  type GeofenceDto,
  type CreateGeofenceCommand,
  type UpdateGeofenceCommand,
} from '../types';

export interface VehiculoSimple {
  id: string;
  patente: string;
}

interface UseGeofencesOptions {
  /** Si se debe cargar automáticamente al montar */
  autoLoad?: boolean;
}

export function useGeofences(options: UseGeofencesOptions = {}) {
  const { autoLoad = true } = options;
  const { t } = useTranslation();
  const toast = useToastStore();

  // Estado local para vehículos (usado en asignación)
  const [vehiculos, setVehiculos] = useState<VehiculoSimple[]>([]);
  const [isLoadingVehiculos, setIsLoadingVehiculos] = useState(false);

  const {
    geofences,
    isLoading,
    error,
    modal,
    assignModal,
    filtros,
    geofenceSeleccionada,
    setGeofences,
    addGeofence,
    updateGeofence,
    removeGeofence,
    setLoading,
    setError,
    openCreateModal,
    openEditModal,
    closeModal,
    openAssignModal,
    closeAssignModal,
    setFiltros,
    clearFiltros,
    setGeofenceSeleccionada,
  } = useGeofencesStore();

  // ================================
  // FETCH FUNCTIONS
  // ================================

  const fetchVehiculos = useCallback(async () => {
    setIsLoadingVehiculos(true);
    try {
      const result = await vehiculosApi.getVehiculos({
        soloActivos: true,
        tamanoPagina: 100,
        soloPropios: true,
      });
      setVehiculos(result.items.map((v) => ({ id: v.id, patente: v.patente })));
    } catch (err) {
      console.error('Error al cargar vehículos:', err);
    } finally {
      setIsLoadingVehiculos(false);
    }
  }, []);

  const fetchGeofences = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await geofencesApi.listar({
        soloActivas: filtros.soloActivas,
        tamanoPagina: GEOFENCES_PAGE_SIZE,
      });

      // Filtrar localmente por búsqueda si es necesario
      let filtered = result.items;
      if (filtros.buscar) {
        const term = filtros.buscar.toLowerCase();
        filtered = result.items.filter(
          (g) =>
            g.nombre.toLowerCase().includes(term) ||
            g.descripcion?.toLowerCase().includes(term)
        );
      }

      setGeofences(filtered);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar geofences';
      setError(message);
      toast.error(t('geofences.errorCargar', 'Error al cargar geozonas'));
    }
  }, [filtros, setLoading, setError, setGeofences, toast, t]);

  // ================================
  // CRUD FUNCTIONS
  // ================================

  const crearGeofence = useCallback(
    async (command: CreateGeofenceCommand) => {
      try {
        const nueva = await geofencesApi.crear(command);
        addGeofence(nueva);
        toast.success(t('geofences.creadaExito', 'Geozona creada exitosamente'));
        return nueva;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear geozona';
        toast.error(message);
        throw err;
      }
    },
    [addGeofence, toast, t]
  );

  const actualizarGeofence = useCallback(
    async (id: string, command: Omit<UpdateGeofenceCommand, 'id'>) => {
      try {
        const actualizada = await geofencesApi.actualizar(id, command);
        updateGeofence(actualizada);
        toast.success(t('geofences.actualizadaExito', 'Geozona actualizada exitosamente'));
        return actualizada;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al actualizar geozona';
        toast.error(message);
        throw err;
      }
    },
    [updateGeofence, toast, t]
  );

  const eliminarGeofence = useCallback(
    async (geofence: GeofenceDto) => {
      try {
        await geofencesApi.eliminar(geofence.id);
        removeGeofence(geofence.id);
        toast.success(t('geofences.eliminadaExito', 'Geozona eliminada exitosamente'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al eliminar geozona';
        toast.error(message);
        throw err;
      }
    },
    [removeGeofence, toast, t]
  );

  const asignarVehiculo = useCallback(
    async (geofenceId: string, vehiculoId: string) => {
      try {
        await geofencesApi.asignarVehiculo(geofenceId, vehiculoId);
        toast.success(t('geofences.vehiculoAsignado', 'Vehículo asignado exitosamente'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al asignar vehículo';
        toast.error(message);
        throw err;
      }
    },
    [toast, t]
  );

  const desasignarVehiculo = useCallback(
    async (geofenceId: string, vehiculoId: string) => {
      try {
        await geofencesApi.desasignarVehiculo(geofenceId, vehiculoId);
        toast.success(t('geofences.vehiculoDesasignado', 'Vehículo desasignado exitosamente'));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al desasignar vehículo';
        toast.error(message);
        throw err;
      }
    },
    [toast, t]
  );

  const handleSubmitModal = useCallback(
    async (data: CreateGeofenceCommand | UpdateGeofenceCommand) => {
      if (modal.mode === 'create') {
        await crearGeofence(data as CreateGeofenceCommand);
      } else {
        const { id, ...rest } = data as UpdateGeofenceCommand;
        await actualizarGeofence(id, rest);
      }
    },
    [modal.mode, crearGeofence, actualizarGeofence]
  );

  // ================================
  // COMPUTED
  // ================================

  const stats = {
    total: geofences.length,
    sincronizadas: geofences.filter((g) => g.syncStatus === SyncStatus.Synced).length,
    conError: geofences.filter((g) => g.syncStatus === SyncStatus.Error).length,
    pendientes: geofences.filter((g) => g.syncStatus === SyncStatus.PendingCreate).length,
  };

  // ================================
  // EFFECTS
  // ================================

  useEffect(() => {
    if (autoLoad) {
      fetchGeofences();
    }
  }, [fetchGeofences, autoLoad]);

  useEffect(() => {
    if (autoLoad) {
      fetchVehiculos();
    }
  }, [fetchVehiculos, autoLoad]);

  // ================================
  // RETURN
  // ================================

  return {
    // State
    geofences,
    isLoading,
    error,
    modal,
    assignModal,
    filtros,
    geofenceSeleccionada,
    vehiculos,
    isLoadingVehiculos,
    stats,

    // Fetch
    fetchGeofences,
    fetchVehiculos,

    // CRUD
    crearGeofence,
    actualizarGeofence,
    eliminarGeofence,
    asignarVehiculo,
    desasignarVehiculo,
    handleSubmitModal,

    // UI Actions
    openCreateModal,
    openEditModal,
    closeModal,
    openAssignModal,
    closeAssignModal,
    setFiltros,
    clearFiltros,
    setGeofenceSeleccionada,
  };
}
