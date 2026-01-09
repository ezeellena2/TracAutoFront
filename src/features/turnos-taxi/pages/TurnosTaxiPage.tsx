/**
 * Página principal de Turnos de Taxi
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle, Car, MapPin } from 'lucide-react';
import { Card, Button, KPICard, PaginationControls, ConfirmationModal } from '@/shared/ui';
import { TurnosTaxiTable, TurnosTaxiFilters, TurnoTaxiModal, TurnosTimeline, SimuladorHora } from '../components';
import type { DiaSemana } from '../types';
import { useTurnosTaxi } from '../hooks/useTurnosTaxi';
import { useTurnosTaxiStore } from '../store/turnosTaxi.store';
import type { TurnoTaxiDto, CreateTurnoTaxiCommand } from '../types';

export function TurnosTaxiPage() {
  const { t } = useTranslation();
  const [turnoAEliminar, setTurnoAEliminar] = useState<TurnoTaxiDto | null>(null);
  const [turnoADuplicar, setTurnoADuplicar] = useState<TurnoTaxiDto | null>(null);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<{ id: string; patente: string } | null>(null);
  const [vistaActual, setVistaActual] = useState<'tabla' | 'timeline'>('tabla');
  const [simuladorActivo, setSimuladorActivo] = useState(false);
  const [horaSimulada, setHoraSimulada] = useState<string>(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [diaSimulado, setDiaSimulado] = useState<DiaSemana>(() => new Date().getDay() as DiaSemana);

  const {
    turnos,
    geofenceVinculos,
    vehiculos,
    isLoading,
    isLoadingGeofences,
    isLoadingVehiculos,
    paginaActual,
    totalPaginas,
    totalRegistros,
    modal,
    filtros,
    openCreateModal,
    openEditModal,
    closeModal,
    setFiltros,
    setPagina,
    handleSubmitModal,
    crearTurno,
    eliminarTurno,
    fetchGeofenceVinculos,
  } = useTurnosTaxi();
  
  const { tamanoPagina } = useTurnosTaxiStore();
  
  const handlePageSizeChange = useCallback((size: number) => {
    console.log('Page size changed to:', size);
  }, []);

  // Calcular KPIs
  const turnosActivos = turnos.filter(t => t.activo);
  const turnosEnCurso = turnos.filter(t => t.activo && t.estaActivoAhora);
  const turnosConGeofence = turnos.filter(t => t.geofences.length > 0);

  const handleOpenCreate = useCallback(() => {
    // Si hay vehículos, seleccionar el primero por defecto
    if (vehiculos.length > 0) {
      setVehiculoSeleccionado(vehiculos[0]);
      openCreateModal();
    }
  }, [openCreateModal, vehiculos]);

  const handleEdit = useCallback((turno: TurnoTaxiDto) => {
    const vehiculo = vehiculos.find(v => v.id === turno.vehiculoId);
    setVehiculoSeleccionado(vehiculo || { id: turno.vehiculoId, patente: turno.vehiculoPatente });
    openEditModal(turno);
  }, [openEditModal, vehiculos]);
  
  const handleDuplicate = useCallback((turno: TurnoTaxiDto) => {
    setTurnoADuplicar(turno);
  }, []);
  
  const handleConfirmDuplicate = useCallback(async () => {
    if (!turnoADuplicar) return;
    
    const command: CreateTurnoTaxiCommand = {
      vehiculoId: turnoADuplicar.vehiculoId,
      nombre: `${turnoADuplicar.nombre} (copia)`,
      horaInicioLocal: turnoADuplicar.horaInicioLocal,
      horaFinLocal: turnoADuplicar.horaFinLocal,
      diasActivos: turnoADuplicar.diasActivos,
      geofenceIds: turnoADuplicar.geofences.map(g => g.id),
    };
    
    await crearTurno(command);
    setTurnoADuplicar(null);
  }, [turnoADuplicar, crearTurno]);

  const handleSimuladorChange = useCallback((hora: string, dia: DiaSemana) => {
    setHoraSimulada(hora);
    setDiaSimulado(dia);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (turnoAEliminar) {
      await eliminarTurno(turnoAEliminar);
      setTurnoAEliminar(null);
    }
  }, [turnoAEliminar, eliminarTurno]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('turnosTaxi.titulo', 'Turnos de Taxi')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('turnosTaxi.subtitulo', 'Gestiona los turnos y zonas de operación de tus vehículos')}
          </p>
        </div>
        
        <Button variant="primary" onClick={handleOpenCreate}>
          + {t('turnosTaxi.nuevoTurno', 'Nuevo Turno')}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title={t('turnosTaxi.totalTurnos', 'Total Turnos')}
          value={totalRegistros}
          icon={Calendar}
        />
        <KPICard
          title={t('turnosTaxi.turnosActivos', 'Turnos Activos')}
          value={turnosActivos.length}
          icon={CheckCircle}
          color="success"
        />
        <KPICard
          title={t('turnosTaxi.enCursoAhora', 'En Curso Ahora')}
          value={turnosEnCurso.length}
          icon={Car}
          color="primary"
        />
        <KPICard
          title={t('turnosTaxi.conGeofence', 'Con Zona Asignada')}
          value={turnosConGeofence.length}
          icon={MapPin}
        />
      </div>

      {/* Controles: Filtros + Simulador + Selector de vista */}
      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-1">
          <div className="p-4">
            <TurnosTaxiFilters
              filtros={filtros}
              onFiltrosChange={setFiltros}
              vehiculos={vehiculos}
              isLoadingVehiculos={isLoadingVehiculos}
            />
          </div>
        </Card>
        
        {/* Selector de vista y simulador */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-1">
            <button
              onClick={() => setVistaActual('tabla')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                vistaActual === 'tabla' 
                  ? 'bg-primary text-white' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              📋 {t('turnosTaxi.vistaTabla', 'Tabla')}
            </button>
            <button
              onClick={() => setVistaActual('timeline')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                vistaActual === 'timeline' 
                  ? 'bg-primary text-white' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              📅 {t('turnosTaxi.vistaTimeline', 'Timeline')}
            </button>
          </div>
          
          <SimuladorHora
            isActive={simuladorActivo}
            onActiveChange={setSimuladorActivo}
            onHoraChange={handleSimuladorChange}
          />
        </div>
      </div>

      {/* Contenido según vista */}
      {vistaActual === 'tabla' ? (
        <Card>
          <div className="p-4">
            <TurnosTaxiTable
              turnos={turnos}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={(turno) => setTurnoAEliminar(turno)}
              onDuplicate={handleDuplicate}
            />
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <PaginationControls
                paginaActual={paginaActual}
                totalPaginas={totalPaginas}
                tamanoPagina={tamanoPagina}
                totalRegistros={totalRegistros}
                onPageChange={setPagina}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </Card>
      ) : (
        <TurnosTimeline
          turnos={turnos}
          onTurnoClick={handleEdit}
          horaActual={horaSimulada}
          diaActual={diaSimulado}
        />
      )}

      {/* Modal Crear/Editar */}
      <TurnoTaxiModal
        isOpen={modal.isOpen}
        mode={modal.mode}
        turno={modal.turno}
        vehiculoId={vehiculoSeleccionado?.id}
        vehiculoPatente={vehiculoSeleccionado?.patente}
        geofenceVinculos={geofenceVinculos}
        isLoadingGeofences={isLoadingGeofences}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
        onRefreshGeofences={fetchGeofenceVinculos}
      />

      {/* Modal Confirmación Eliminar */}
      <ConfirmationModal
        isOpen={!!turnoAEliminar}
        onClose={() => setTurnoAEliminar(null)}
        onConfirm={handleConfirmDelete}
        title={t('turnosTaxi.confirmarEliminar', 'Eliminar Turno')}
        description={t('turnosTaxi.confirmarEliminarMsg', '¿Estás seguro de que deseas eliminar el turno "{{nombre}}"? Esta acción no se puede deshacer.', { nombre: turnoAEliminar?.nombre })}
        confirmText={t('common.eliminar', 'Eliminar')}
        variant="danger"
      />
      
      {/* Modal Confirmación Duplicar */}
      <ConfirmationModal
        isOpen={!!turnoADuplicar}
        onClose={() => setTurnoADuplicar(null)}
        onConfirm={handleConfirmDuplicate}
        title={t('turnosTaxi.duplicarTurno', 'Duplicar Turno')}
        description={t('turnosTaxi.confirmarDuplicarMsg', '¿Deseas crear una copia del turno "{{nombre}}"?', { nombre: turnoADuplicar?.nombre })}
        confirmText={t('turnosTaxi.duplicar', 'Duplicar')}
        variant="info"
      />
    </div>
  );
}
