import { useCallback, useEffect, useState } from 'react';
import { conductoresApi, vehiculosApi, dispositivosApi } from '@/services/endpoints';
import { usePaginationParams } from '@/hooks';
import { toast } from '@/store/toast.store';
import type {
  ConductorDto,
  CreateConductorCommand,
  ConductorVehiculoAsignacionDto,
  ConductorDispositivoAsignacionDto,
} from '../types';
import type { ListaPaginada, DispositivoDto } from '@/shared/types/api';
import type { VehiculoDto } from '@/features/vehicles/types';

export function useDriversPage() {
  // Data state
  const [conductoresData, setConductoresData] = useState<ListaPaginada<ConductorDto> | null>(null);
  const [vehiculos, setVehiculos] = useState<VehiculoDto[]>([]);
  const [dispositivos, setDispositivos] = useState<DispositivoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [buscar, setBuscar] = useState('');
  const [soloActivos, setSoloActivos] = useState<boolean | null>(null);

  // Hook de paginación
  const {
    setNumeroPagina,
    setTamanoPagina,
    params: paginationParams,
  } = usePaginationParams({ initialPageSize: 10 });

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateConductorCommand>({
    nombreCompleto: '',
    dni: '',
    email: '',
    telefono: '',
  });
  const [createErrors, setCreateErrors] = useState<{ nombreCompleto?: string }>({});

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingConductor, setEditingConductor] = useState<ConductorDto | null>(null);
  const [editForm, setEditForm] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
  });

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [conductorToDelete, setConductorToDelete] = useState<ConductorDto | null>(null);

  // Assignment modals
  const [isAssignVehicleModalOpen, setIsAssignVehicleModalOpen] = useState(false);
  const [isAssignDeviceModalOpen, setIsAssignDeviceModalOpen] = useState(false);
  const [isViewAssignmentsModalOpen, setIsViewAssignmentsModalOpen] = useState(false);
  const [conductorForAssignment, setConductorForAssignment] = useState<ConductorDto | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isAssigningVehicle, setIsAssigningVehicle] = useState(false);
  const [isAssigningDevice, setIsAssigningDevice] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [assignments, setAssignments] = useState<{
    vehiculos: ConductorVehiculoAsignacionDto[];
    dispositivos: ConductorDispositivoAsignacionDto[];
  }>({ vehiculos: [], dispositivos: [] });

  // Unassign modals
  const [isUnassignVehicleModalOpen, setIsUnassignVehicleModalOpen] = useState(false);
  const [isUnassignDeviceModalOpen, setIsUnassignDeviceModalOpen] = useState(false);
  const [isUnassigningVehicle, setIsUnassigningVehicle] = useState(false);
  const [isUnassigningDevice, setIsUnassigningDevice] = useState(false);
  const [assignmentToUnassign, setAssignmentToUnassign] = useState<{
    type: 'vehiculo' | 'dispositivo';
    id: string;
    name: string;
  } | null>(null);

  // Action menu state
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [conductoresResult, vehiculosResult, dispositivosResult] = await Promise.all([
        conductoresApi.listar(
          paginationParams.numeroPagina || 1,
          paginationParams.tamanoPagina || 10,
          soloActivos ?? undefined,
          buscar.trim() || undefined
        ),
        vehiculosApi.getVehiculos({ tamanoPagina: 100 }),
        dispositivosApi.getDispositivos({ tamanoPagina: 100 }),
      ]);
      setConductoresData(conductoresResult);
      setVehiculos(vehiculosResult.items);
      setDispositivos(dispositivosResult.items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo cargar los datos';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [paginationParams, soloActivos, buscar]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Create handlers
  const handleCreate = async () => {
    const errors: { nombreCompleto?: string } = {};
    if (!createForm.nombreCompleto.trim()) {
      errors.nombreCompleto = 'El nombre completo es requerido';
    }
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setIsCreating(true);
    try {
      await conductoresApi.crear({
        nombreCompleto: createForm.nombreCompleto.trim(),
        dni: createForm.dni?.trim() || undefined,
        email: createForm.email?.trim() || undefined,
        telefono: createForm.telefono?.trim() || undefined,
      });
      toast.success('Conductor creado correctamente');
      setIsCreateModalOpen(false);
      setCreateForm({ nombreCompleto: '', dni: '', email: '', telefono: '' });
      setCreateErrors({});
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo crear el conductor';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  // Edit handlers
  const handleOpenEdit = (conductor: ConductorDto) => {
    setEditingConductor(conductor);
    setEditForm({
      nombreCompleto: conductor.nombreCompleto,
      email: conductor.email || '',
      telefono: conductor.telefono || '',
    });
    setIsEditModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleUpdate = async () => {
    if (!editingConductor) return;

    setIsUpdating(true);
    try {
      await conductoresApi.actualizar(editingConductor.id, {
        nombreCompleto: editForm.nombreCompleto.trim(),
        email: editForm.email?.trim() || undefined,
        telefono: editForm.telefono?.trim() || undefined,
      });
      toast.success('Conductor actualizado correctamente');
      setIsEditModalOpen(false);
      setEditingConductor(null);
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo actualizar el conductor';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete handlers
  const handleOpenDelete = (conductor: ConductorDto) => {
    setConductorToDelete(conductor);
    setIsDeleteModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleDelete = async () => {
    if (!conductorToDelete) return;

    setIsDeleting(true);
    try {
      await conductoresApi.eliminar(conductorToDelete.id);
      toast.success('Conductor eliminado correctamente');
      setIsDeleteModalOpen(false);
      setConductorToDelete(null);
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar el conductor';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Assignment handlers
  const handleOpenAssignVehicle = (conductor: ConductorDto) => {
    setConductorForAssignment(conductor);
    setSelectedVehicleId('');
    setIsAssignVehicleModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleAssignVehicle = async () => {
    if (!conductorForAssignment || !selectedVehicleId) {
      toast.error('Debe seleccionar un vehículo');
      return;
    }

    setIsAssigningVehicle(true);
    try {
      await conductoresApi.asignarVehiculo(conductorForAssignment.id, {
        vehiculoId: selectedVehicleId,
      });
      toast.success('Vehículo asignado correctamente');
      setIsAssignVehicleModalOpen(false);
      setConductorForAssignment(null);
      setSelectedVehicleId('');
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo asignar el vehículo';
      toast.error(msg);
    } finally {
      setIsAssigningVehicle(false);
    }
  };

  const handleOpenAssignDevice = (conductor: ConductorDto) => {
    setConductorForAssignment(conductor);
    setSelectedDeviceId('');
    setIsAssignDeviceModalOpen(true);
    setActionMenuOpen(null);
  };

  const handleAssignDevice = async () => {
    if (!conductorForAssignment || !selectedDeviceId) {
      toast.error('Debe seleccionar un dispositivo');
      return;
    }

    setIsAssigningDevice(true);
    try {
      await conductoresApi.asignarDispositivo(conductorForAssignment.id, {
        dispositivoId: selectedDeviceId,
      });
      toast.success('Dispositivo asignado correctamente');
      setIsAssignDeviceModalOpen(false);
      setConductorForAssignment(null);
      setSelectedDeviceId('');
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo asignar el dispositivo';
      toast.error(msg);
    } finally {
      setIsAssigningDevice(false);
    }
  };

  const loadAssignments = useCallback(async (conductorId: string) => {
    setIsLoadingAssignments(true);
    try {
      const [vehiculosResult, dispositivosResult] = await Promise.all([
        conductoresApi.obtenerAsignacionesVehiculos(conductorId, false),
        conductoresApi.obtenerAsignacionesDispositivos(conductorId, false),
      ]);
      setAssignments({
        vehiculos: vehiculosResult,
        dispositivos: dispositivosResult,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudieron cargar las asignaciones';
      toast.error(msg);
    } finally {
      setIsLoadingAssignments(false);
    }
  }, []);

  const handleOpenViewAssignments = async (conductor: ConductorDto) => {
    setConductorForAssignment(conductor);
    setIsViewAssignmentsModalOpen(true);
    setActionMenuOpen(null);
    await loadAssignments(conductor.id);
  };

  const handleOpenUnassignVehicle = (asignacion: ConductorVehiculoAsignacionDto) => {
    if (asignacion.finUtc) {
      toast.error('Esta asignación ya está finalizada');
      return;
    }
    setAssignmentToUnassign({
      type: 'vehiculo',
      id: asignacion.vehiculoId,
      name: asignacion.vehiculoPatente,
    });
    setIsUnassignVehicleModalOpen(true);
  };

  const handleUnassignVehicle = async () => {
    if (!conductorForAssignment || !assignmentToUnassign) return;

    setIsUnassigningVehicle(true);
    try {
      await conductoresApi.desasignarVehiculo(
        conductorForAssignment.id,
        assignmentToUnassign.id
      );
      toast.success('Vehículo desasignado correctamente');
      setIsUnassignVehicleModalOpen(false);
      setAssignmentToUnassign(null);
      // Recargar asignaciones si el modal está abierto
      if (conductorForAssignment && isViewAssignmentsModalOpen) {
        await loadAssignments(conductorForAssignment.id);
      }
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo desasignar el vehículo';
      toast.error(msg);
    } finally {
      setIsUnassigningVehicle(false);
    }
  };

  const handleOpenUnassignDevice = (asignacion: ConductorDispositivoAsignacionDto) => {
    if (asignacion.finUtc) {
      toast.error('Esta asignación ya está finalizada');
      return;
    }
    setAssignmentToUnassign({
      type: 'dispositivo',
      id: asignacion.dispositivoId,
      name: asignacion.dispositivoNombre,
    });
    setIsUnassignDeviceModalOpen(true);
  };

  const handleUnassignDevice = async () => {
    if (!conductorForAssignment || !assignmentToUnassign) return;

    setIsUnassigningDevice(true);
    try {
      await conductoresApi.desasignarDispositivo(
        conductorForAssignment.id,
        assignmentToUnassign.id
      );
      toast.success('Dispositivo desasignado correctamente');
      setIsUnassignDeviceModalOpen(false);
      setAssignmentToUnassign(null);
      // Recargar asignaciones si el modal está abierto
      if (conductorForAssignment && isViewAssignmentsModalOpen) {
        await loadAssignments(conductorForAssignment.id);
      }
      await loadData();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo desasignar el dispositivo';
      toast.error(msg);
    } finally {
      setIsUnassigningDevice(false);
    }
  };

  // Table helpers
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
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
    paginationParams,
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
    isCreating,
    isUpdating,
    isDeleting,
    isAssigningVehicle,
    isAssigningDevice,
    isLoadingAssignments,
    isUnassigningVehicle,
    isUnassigningDevice,

    // Form states
    createForm,
    setCreateForm,
    createErrors,
    setCreateErrors,
    editingConductor,
    editForm,
    setEditForm,
    conductorToDelete,
    conductorForAssignment,
    selectedVehicleId,
    setSelectedVehicleId,
    selectedDeviceId,
    setSelectedDeviceId,
    assignmentToUnassign,

    // Handlers
    handleCreate,
    handleOpenEdit,
    handleUpdate,
    handleOpenDelete,
    handleDelete,
    handleOpenAssignVehicle,
    handleAssignVehicle,
    handleOpenAssignDevice,
    handleAssignDevice,
    handleOpenViewAssignments,
    handleOpenUnassignVehicle,
    handleUnassignVehicle,
    handleOpenUnassignDevice,
    handleUnassignDevice,
    loadData,
    loadAssignments,

    // Action menu
    actionMenuOpen,
    setActionMenuOpen,

    // Helpers
    formatDate,
    formatDateTime,
  };
}

