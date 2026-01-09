/**
 * Tabla de turnos de taxi con acciones
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Badge, ActionMenu } from '@/shared/ui';
import { formatDiasActivos, formatRangoHorario } from '../types';
import type { TurnoTaxiDto } from '../types';

interface TurnosTaxiTableProps {
  turnos: TurnoTaxiDto[];
  isLoading: boolean;
  onEdit: (turno: TurnoTaxiDto) => void;
  onDelete: (turno: TurnoTaxiDto) => void;
  onDuplicate?: (turno: TurnoTaxiDto) => void;
  onViewDetails?: (turno: TurnoTaxiDto) => void;
}

export function TurnosTaxiTable({
  turnos,
  isLoading,
  onEdit,
  onDelete,
  onDuplicate,
  onViewDetails,
}: TurnosTaxiTableProps) {
  const { t } = useTranslation();

  const columns = [
    {
      key: 'nombre',
      header: t('turnosTaxi.nombre', 'Nombre'),
      render: (turno: TurnoTaxiDto) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-white">
            {turno.nombre}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {turno.vehiculoPatente}
          </span>
        </div>
      ),
    },
    {
      key: 'horario',
      header: t('turnosTaxi.horario', 'Horario'),
      render: (turno: TurnoTaxiDto) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">
            {formatRangoHorario(turno.horaInicioLocal, turno.horaFinLocal, turno.cruzaMedianoche)}
          </span>
        </div>
      ),
    },
    {
      key: 'dias',
      header: t('turnosTaxi.dias', 'Días'),
      render: (turno: TurnoTaxiDto) => (
        <span className="text-sm">
          {formatDiasActivos(turno.diasActivos)}
        </span>
      ),
    },
    {
      key: 'geofences',
      header: t('turnosTaxi.geofences', 'Geofences'),
      render: (turno: TurnoTaxiDto) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {turno.geofences.length > 0 
            ? `${turno.geofences.length} zona${turno.geofences.length > 1 ? 's' : ''}`
            : '-'
          }
        </span>
      ),
    },
    {
      key: 'estado',
      header: t('turnosTaxi.estado', 'Estado'),
      render: (turno: TurnoTaxiDto) => (
        <div className="flex flex-col gap-1">
          <Badge 
            variant={turno.activo ? 'success' : 'default'}
            size="sm"
          >
            {turno.activo 
              ? t('turnosTaxi.activo', 'Activo') 
              : t('turnosTaxi.inactivo', 'Inactivo')
            }
          </Badge>
          {turno.estaActivoAhora && turno.activo && (
            <Badge variant="info" size="sm">
              {t('turnosTaxi.enCurso', 'En curso')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'acciones',
      header: '',
      render: (turno: TurnoTaxiDto) => (
        <TurnoActions 
          turno={turno} 
          onEdit={onEdit} 
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onViewDetails={onViewDetails}
        />
      ),
    },
  ];

  function TurnoActions({ 
    turno, 
    onEdit: handleEdit, 
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
    onViewDetails: handleViewDetails 
  }: { 
    turno: TurnoTaxiDto; 
    onEdit: (t: TurnoTaxiDto) => void; 
    onDelete: (t: TurnoTaxiDto) => void;
    onDuplicate?: (t: TurnoTaxiDto) => void;
    onViewDetails?: (t: TurnoTaxiDto) => void;
  }) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Manejo de teclado para cerrar menú con Escape
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    return (
      <ActionMenu
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        onClose={() => setIsOpen(false)}
      >
        <div 
          role="menu" 
          aria-label={t('turnosTaxi.accionesTurno', 'Acciones del turno {{nombre}}', { nombre: turno.nombre })}
          onKeyDown={handleKeyDown}
        >
          {handleViewDetails && (
            <button
              role="menuitem"
              className="w-full px-4 py-2 text-left text-sm hover:bg-surface focus:bg-surface focus:outline-none"
              onClick={() => { handleViewDetails(turno); setIsOpen(false); }}
              aria-label={t('common.verDetalles', 'Ver detalles de {{nombre}}', { nombre: turno.nombre })}
            >
              <span aria-hidden="true">👁️</span> {t('common.verDetalles', 'Ver detalles')}
            </button>
          )}
          <button
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm hover:bg-surface focus:bg-surface focus:outline-none"
            onClick={() => { handleEdit(turno); setIsOpen(false); }}
            aria-label={t('common.editar', 'Editar turno {{nombre}}', { nombre: turno.nombre })}
          >
            <span aria-hidden="true">✏️</span> {t('common.editar', 'Editar')}
          </button>
          {handleDuplicate && (
            <button
              role="menuitem"
              className="w-full px-4 py-2 text-left text-sm hover:bg-surface focus:bg-surface focus:outline-none"
              onClick={() => { handleDuplicate(turno); setIsOpen(false); }}
              aria-label={t('turnosTaxi.duplicar', 'Duplicar turno {{nombre}}', { nombre: turno.nombre })}
            >
              <span aria-hidden="true">📋</span> {t('turnosTaxi.duplicar', 'Duplicar')}
            </button>
          )}
          <button
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-surface focus:bg-surface focus:outline-none"
            onClick={() => { handleDelete(turno); setIsOpen(false); }}
            aria-label={t('common.eliminar', 'Eliminar turno {{nombre}}', { nombre: turno.nombre })}
          >
            <span aria-hidden="true">🗑️</span> {t('common.eliminar', 'Eliminar')}
          </button>
        </div>
      </ActionMenu>
    );
  }

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center py-12"
        role="status"
        aria-live="polite"
        aria-label={t('common.cargando', 'Cargando...')}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">{t('common.cargando', 'Cargando turnos...')}</span>
      </div>
    );
  }

  if (turnos.length === 0) {
    return (
      <div 
        className="text-center py-12"
        role="status"
        aria-live="polite"
      >
        <p className="text-gray-500 dark:text-gray-400">
          {t('turnosTaxi.sinTurnos', 'No hay turnos configurados')}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {t('turnosTaxi.crearPrimero', 'Crea tu primer turno para empezar')}
        </p>
      </div>
    );
  }

  return (
    <div role="region" aria-label={t('turnosTaxi.tablaTurnos', 'Tabla de turnos de taxi')}>
      <Table
        data={turnos}
        columns={columns}
        keyExtractor={(turno) => turno.id}
      />
    </div>
  );
}
