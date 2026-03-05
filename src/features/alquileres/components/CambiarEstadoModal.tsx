import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, Select, Button, Badge, ApiErrorBanner } from '@/shared/ui';
import { vehiculosAlquilerApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import { EstadoVehiculoAlquiler } from '../types/vehiculoAlquiler';
import type { VehiculoAlquilerDto } from '../types/vehiculoAlquiler';

interface CambiarEstadoModalProps {
  isOpen: boolean;
  vehiculo: VehiculoAlquilerDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ESTADO_BADGE_VARIANT: Record<number, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  [EstadoVehiculoAlquiler.Disponible]: 'success',
  [EstadoVehiculoAlquiler.Reservado]: 'info',
  [EstadoVehiculoAlquiler.EnUso]: 'warning',
  [EstadoVehiculoAlquiler.EnMantenimiento]: 'warning',
  [EstadoVehiculoAlquiler.FueraDeServicio]: 'error',
  [EstadoVehiculoAlquiler.EnTransito]: 'default',
};

export { ESTADO_BADGE_VARIANT };

export function CambiarEstadoModal({ isOpen, vehiculo, onClose, onSuccess }: CambiarEstadoModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [nuevoEstado, setNuevoEstado] = useState<number | ''>('');
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const estadoOptions = Object.values(EstadoVehiculoAlquiler)
    .filter(v => typeof v === 'number' && v !== vehiculo?.estado)
    .map(v => ({ value: v as number, label: t(`alquileres.flota.estados.${v}`) }));

  const handleSubmit = async () => {
    if (!vehiculo || nuevoEstado === '') return;

    setIsLoading(true);
    setApiError(null);

    try {
      await vehiculosAlquilerApi.changeEstado(vehiculo.id, {
        id: vehiculo.id,
        nuevoEstado: nuevoEstado as number,
      });
      toast.success(t('alquileres.flota.cambiarEstado.exito'));
      setNuevoEstado('');
      setApiError(null);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const parsed = handleApiError(err, { showToast: false });
      setApiError(parsed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNuevoEstado('');
    setApiError(null);
    onClose();
  };

  if (!vehiculo) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-text">{t('alquileres.flota.cambiarEstado.titulo')}</h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <ApiErrorBanner error={apiError} jiraLabel="Error cambio estado vehículo" onReportClick={handleClose} />

        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-muted mb-2">{vehiculo.patente} — {vehiculo.marca} {vehiculo.modelo}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text">{t('alquileres.flota.cambiarEstado.estadoActual')}:</span>
              <Badge variant={ESTADO_BADGE_VARIANT[vehiculo.estado]}>
                {t(`alquileres.flota.estados.${vehiculo.estado}`)}
              </Badge>
            </div>
          </div>

          <Select
            label={t('alquileres.flota.cambiarEstado.nuevoEstado')}
            value={nuevoEstado}
            onChange={(v) => setNuevoEstado(Number(v))}
            options={estadoOptions}
            placeholder={t('alquileres.flota.cambiarEstado.seleccionar')}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || nuevoEstado === ''}
              className="flex-1"
            >
              {isLoading ? t('common.saving') : t('alquileres.flota.cambiarEstado.confirmar')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
