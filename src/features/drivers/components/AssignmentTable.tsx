import { Unlink } from 'lucide-react';
import { Badge, Button } from '@/shared/ui';
import type {
  ConductorVehiculoAsignacionDto,
  ConductorDispositivoAsignacionDto,
} from '../types';

type Assignment = ConductorVehiculoAsignacionDto | ConductorDispositivoAsignacionDto;

interface AssignmentTableProps<T extends Assignment> {
  assignments: T[];
  type: 'vehiculo' | 'dispositivo';
  canEdit: boolean;
  formatDateTime: (dateStr: string) => string;
  onUnassign: (assignment: T) => void;
}

export function AssignmentTable<T extends Assignment>({
  assignments,
  type,
  canEdit,
  formatDateTime,
  onUnassign,
}: AssignmentTableProps<T>) {
  const getAssignmentName = (assignment: T): string => {
    if (type === 'vehiculo') {
      return (assignment as ConductorVehiculoAsignacionDto).vehiculoPatente;
    }
    return (assignment as ConductorDispositivoAsignacionDto).dispositivoNombre;
  };

  const getColumnHeader = (): string => {
    return type === 'vehiculo' ? 'Patente' : 'Dispositivo';
  };

  if (assignments.length === 0) {
    return (
      <p className="text-text-muted text-sm">
        No hay asignaciones de {type === 'vehiculo' ? 'vehículos' : 'dispositivos'}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-2 text-left font-medium text-text-muted">
              {getColumnHeader()}
            </th>
            <th className="px-4 py-2 text-left font-medium text-text-muted">Inicio</th>
            <th className="px-4 py-2 text-left font-medium text-text-muted">Fin</th>
            <th className="px-4 py-2 text-left font-medium text-text-muted">Estado</th>
            <th className="px-4 py-2 text-left font-medium text-text-muted"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {assignments.map((asignacion) => (
            <tr key={asignacion.id}>
              <td className="px-4 py-2 text-text">{getAssignmentName(asignacion)}</td>
              <td className="px-4 py-2 text-text-muted">{formatDateTime(asignacion.inicioUtc)}</td>
              <td className="px-4 py-2 text-text-muted">
                {asignacion.finUtc ? formatDateTime(asignacion.finUtc) : '-'}
              </td>
              <td className="px-4 py-2">
                <Badge variant={asignacion.finUtc ? 'default' : 'success'}>
                  {asignacion.finUtc ? 'Finalizada' : 'Activa'}
                </Badge>
              </td>
              <td className="px-4 py-2">
                {!asignacion.finUtc && canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUnassign(asignacion)}
                    title="Desasignar"
                  >
                    <Unlink size={14} className="text-error" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

