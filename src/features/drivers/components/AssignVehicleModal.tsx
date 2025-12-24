import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, Button } from '@/shared/ui';
import { conductoresApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ConductorDto } from '../types';
import type { VehiculoDto } from '@/features/vehicles/types';

interface AssignVehicleModalProps {
  isOpen: boolean;
  conductor: ConductorDto | null;
  vehiculos: VehiculoDto[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignVehicleModal({
  isOpen,
  conductor,
  vehiculos,
  onClose,
  onSuccess,
}: AssignVehicleModalProps) {
  const { t } = useTranslation();
  const { getErrorMessage } = useErrorHandler();
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedVehicleId('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conductor || !selectedVehicleId) {
      toast.error(t('drivers.errors.mustSelectVehicle'));
      return;
    }

    setIsLoading(true);

    try {
      await conductoresApi.asignarVehiculo(conductor.id, {
        vehiculoId: selectedVehicleId,
      });
      toast.success(t('drivers.success.vehicleAssigned'));
      setSelectedVehicleId('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!conductor) return null;

  const vehiculosActivos = vehiculos.filter((v) => v.activo);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">{t('drivers.assignVehicleModal.title')}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="text-xs text-text-muted mb-1">{t('drivers.assignVehicleModal.driver')}</p>
            <p className="font-medium text-text">{conductor.nombreCompleto}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('drivers.assignVehicleModal.vehicleLabel')}
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">{t('drivers.assignVehicleModal.vehiclePlaceholder')}</option>
              {vehiculosActivos.map((vehiculo) => (
                <option key={vehiculo.id} value={vehiculo.id}>
                  {vehiculo.patente} - {vehiculo.marca} {vehiculo.modelo}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              {t('drivers.assignVehicleModal.vehicleHint')}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !selectedVehicleId} className="flex-1">
              {isLoading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
