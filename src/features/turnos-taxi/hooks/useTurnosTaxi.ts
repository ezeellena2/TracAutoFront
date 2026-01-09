/**
 * Hook para manejar la lógica de Turnos de Taxi
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTurnosTaxiStore } from '../store/turnosTaxi.store';
import { turnosTaxiApi, geofenceVinculosApi } from '../api';
import { vehiculosApi } from '@/services/endpoints/vehiculos.api';
import { useToastStore } from '@/store/toast.store';
import type { 
  TurnoTaxiDto, 
  CreateTurnoTaxiCommand, 
  UpdateTurnoTaxiCommand 
} from '../types';

export interface VehiculoSimple {
  id: string;
  patente: string;
}

interface UseTurnosTaxiOptions {
  /** Si se debe cargar automáticamente al montar */
  autoLoad?: boolean;
}

export function useTurnosTaxi(options: UseTurnosTaxiOptions = {}) {
  const { autoLoad = true } = options;
  const { t } = useTranslation();
  const toast = useToastStore();
  
  // Estado local para vehículos
  const [vehiculos, setVehiculos] = useState<VehiculoSimple[]>([]);
  const [isLoadingVehiculos, setIsLoadingVehiculos] = useState(false);
  
  const {
    turnos,
    turnosActivos,
    geofenceVinculos,
    isLoading,
    isLoadingActivos,
    isLoadingGeofences,
    error,
    paginaActual,
    totalPaginas,
    totalRegistros,
    tamanoPagina,
    modal,
    filtros,
    turnoSeleccionado,
    setTurnos,
    setTurnosActivos,
    setGeofenceVinculos,
    addTurno,
    updateTurno,
    removeTurno,
    setLoading,
    setLoadingActivos,
    setLoadingGeofences,
    setError,
    openCreateModal,
    openEditModal,
    closeModal,
    setFiltros,
    clearFiltros,
    setTurnoSeleccionado,
    setPagina,
  } = useTurnosTaxiStore();

  // ================================
  // FETCH FUNCTIONS
  // ================================

  const fetchVehiculos = useCallback(async () => {
    setIsLoadingVehiculos(true);
    try {
      // Obtener todos los vehículos activos (sin paginación para el selector)
      const result = await vehiculosApi.getVehiculos({ 
        soloActivos: true, 
        tamanoPagina: 100,
        soloPropios: true 
      });
      setVehiculos(result.items.map(v => ({ id: v.id, patente: v.patente })));
    } catch (err) {
      console.error('Error al cargar vehículos:', err);
    } finally {
      setIsLoadingVehiculos(false);
    }
  }, []);

  const fetchTurnos = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await turnosTaxiApi.listar({
        numeroPagina: paginaActual,
        tamanoPagina,
        vehiculoId: filtros.vehiculoId,
        soloActivos: filtros.soloActivos,
        buscar: filtros.buscar,
      });
      
      setTurnos(result.items, {
        paginaActual: result.paginaActual,
        totalPaginas: result.totalPaginas,
        totalRegistros: result.totalRegistros,
        tamanoPagina: result.tamanoPagina,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar turnos';
      setError(message);
      toast.error(t('turnosTaxi.errorCargar', 'Error al cargar turnos'));
    }
  }, [paginaActual, tamanoPagina, filtros, setLoading, setError, setTurnos, toast, t]);

  const fetchTurnosActivos = useCallback(async (vehiculoIds?: string[]) => {
    setLoadingActivos(true);
    
    try {
      const result = await turnosTaxiApi.obtenerActivos({ vehiculoIds });
      setTurnosActivos(result);
    } catch (err) {
      console.error('Error al cargar turnos activos:', err);
      // No mostramos toast para no interrumpir la experiencia del mapa
    }
  }, [setLoadingActivos, setTurnosActivos]);

  const fetchGeofenceVinculos = useCallback(async () => {
    setLoadingGeofences(true);
    
    try {
      const result = await geofenceVinculosApi.listar(true);
      setGeofenceVinculos(result);
    } catch (err) {
      console.error('Error al cargar geofences:', err);
      toast.error(t('turnosTaxi.errorCargarGeofences', 'Error al cargar zonas geográficas'));
    }
  }, [setLoadingGeofences, setGeofenceVinculos, toast, t]);

  // ================================
  // CRUD FUNCTIONS
  // ================================

  const crearTurno = useCallback(async (command: CreateTurnoTaxiCommand) => {
    try {
      const nuevoTurno = await turnosTaxiApi.crear(command);
      addTurno(nuevoTurno);
      toast.success(t('turnosTaxi.creadoExito', 'Turno creado exitosamente'));
      return nuevoTurno;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear turno';
      toast.error(message);
      throw err;
    }
  }, [addTurno, toast, t]);

  const actualizarTurno = useCallback(async (id: string, command: Omit<UpdateTurnoTaxiCommand, 'id'>) => {
    try {
      const turnoActualizado = await turnosTaxiApi.actualizar(id, command);
      updateTurno(turnoActualizado);
      toast.success(t('turnosTaxi.actualizadoExito', 'Turno actualizado exitosamente'));
      return turnoActualizado;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar turno';
      toast.error(message);
      throw err;
    }
  }, [updateTurno, toast, t]);

  const eliminarTurno = useCallback(async (turno: TurnoTaxiDto) => {
    try {
      await turnosTaxiApi.eliminar(turno.id);
      removeTurno(turno.id);
      toast.success(t('turnosTaxi.eliminadoExito', 'Turno eliminado exitosamente'));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar turno';
      toast.error(message);
      throw err;
    }
  }, [removeTurno, toast, t]);

  const handleSubmitModal = useCallback(async (data: CreateTurnoTaxiCommand | UpdateTurnoTaxiCommand) => {
    if (modal.mode === 'create') {
      await crearTurno(data as CreateTurnoTaxiCommand);
    } else {
      await actualizarTurno((data as UpdateTurnoTaxiCommand).id, data as UpdateTurnoTaxiCommand);
    }
  }, [modal.mode, crearTurno, actualizarTurno]);

  // ================================
  // EFFECTS
  // ================================

  // Cargar turnos cuando cambian filtros o paginación
  useEffect(() => {
    if (autoLoad) {
      fetchTurnos();
    }
  }, [fetchTurnos, autoLoad]);

  // Cargar geofences al montar
  useEffect(() => {
    if (autoLoad) {
      fetchGeofenceVinculos();
    }
  }, [fetchGeofenceVinculos, autoLoad]);

  // Cargar vehículos al montar
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
    turnos,
    turnosActivos,
    geofenceVinculos,
    isLoading,
    isLoadingActivos,
    isLoadingGeofences,
    isLoadingVehiculos,
    error,
    paginaActual,
    totalPaginas,
    totalRegistros,
    modal,
    filtros,
    turnoSeleccionado,
    vehiculos,

    // Fetch
    fetchTurnos,
    fetchTurnosActivos,
    fetchGeofenceVinculos,
    fetchVehiculos,

    // CRUD
    crearTurno,
    actualizarTurno,
    eliminarTurno,
    handleSubmitModal,

    // UI Actions
    openCreateModal,
    openEditModal,
    closeModal,
    setFiltros,
    clearFiltros,
    setTurnoSeleccionado,
    setPagina,
  };
}
