import { Car, Smartphone } from 'lucide-react';
import { Modal } from '@/shared/ui';
import { AssignmentTable } from './AssignmentTable';
import type { ConductorDto, ConductorVehiculoAsignacionDto, ConductorDispositivoAsignacionDto } from '../types';

interface ViewAssignmentsModalProps {
  isOpen: boolean;
  conductor: ConductorDto | null;
  vehiculosAssignments: ConductorVehiculoAsignacionDto[];
  dispositivosAssignments: ConductorDispositivoAsignacionDto[];
  isLoading: boolean;
  canEdit: boolean;
  formatDateTime: (dateStr: string) => string;
  onClose: () => void;
  onUnassignVehicle: (assignment: ConductorVehiculoAsignacionDto) => void;
  onUnassignDevice: (assignment: ConductorDispositivoAsignacionDto) => void;
}

export function ViewAssignmentsModal({
  isOpen,
  conductor,
  vehiculosAssignments,
  dispositivosAssignments,
  isLoading,
  canEdit,
  formatDateTime,
  onClose,
  onUnassignVehicle,
  onUnassignDevice,
}: ViewAssignmentsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 max-w-4xl w-full">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text">
            {conductor ? `Asignaciones - ${conductor.nombreCompleto}` : 'Asignaciones'}
          </h2>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {/* Vehículos */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                  <Car size={18} />
                  Vehículos
                </h3>
                <AssignmentTable
                  assignments={vehiculosAssignments}
                  type="vehiculo"
                  canEdit={canEdit}
                  formatDateTime={formatDateTime}
                  onUnassign={onUnassignVehicle}
                />
              </div>

              {/* Dispositivos */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                  <Smartphone size={18} />
                  Dispositivos
                </h3>
                <AssignmentTable
                  assignments={dispositivosAssignments}
                  type="dispositivo"
                  canEdit={canEdit}
                  formatDateTime={formatDateTime}
                  onUnassign={onUnassignDevice}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

