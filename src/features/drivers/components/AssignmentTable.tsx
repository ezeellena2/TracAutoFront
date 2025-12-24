import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const getAssignmentName = (assignment: T): string => {
    if (type === 'vehiculo') {
      return (assignment as ConductorVehiculoAsignacionDto).vehiculoPatente;
    }
    return (assignment as ConductorDispositivoAsignacionDto).dispositivoNombre;
  };

  const getColumnHeader = (): string => {
    return type === 'vehiculo' ? t('drivers.assignmentsModal.licensePlate') : t('drivers.assignmentsModal.device');
  };

  if (assignments.length === 0) {
    return (
      <p className="text-text-muted text-sm">
        {type === 'vehiculo' ? t('drivers.assignmentsModal.emptyVehicles') : t('drivers.assignmentsModal.emptyDevices')}
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
            <th className="px-4 py-2 text-left font-medium text-text-muted">{t('drivers.assignmentsModal.start')}</th>
            <th className="px-4 py-2 text-left font-medium text-text-muted">{t('drivers.assignmentsModal.end')}</th>
            <th className="px-4 py-2 text-left font-medium text-text-muted">{t('drivers.assignmentsModal.status')}</th>
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
                  {asignacion.finUtc ? t('drivers.assignmentsModal.finished') : t('drivers.assignmentsModal.active')}
                </Badge>
              </td>
              <td className="px-4 py-2">
                {!asignacion.finUtc && canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUnassign(asignacion)}
                    title={t('drivers.assignmentsModal.unassign')}
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
