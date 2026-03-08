import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
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
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <Modal.Header
        icon={<RefreshCw size={20} />}
        title={t('alquileres.flota.cambiarEstado.titulo')}
        subtitle={`${vehiculo.patente} — ${vehiculo.marca} ${vehiculo.modelo}`}
        badge={
          <Badge variant={ESTADO_BADGE_VARIANT[vehiculo.estado]}>
            {t(`alquileres.flota.estados.${vehiculo.estado}`)}
          </Badge>
        }
        onClose={handleClose}
      />

      <Modal.Body>
        <ApiErrorBanner error={apiError} jiraLabel="Error cambio estado vehículo" onReportClick={handleClose} />

        <div className="space-y-4">
          <Select
            label={t('alquileres.flota.cambiarEstado.nuevoEstado')}
            value={nuevoEstado}
            onChange={(v) => setNuevoEstado(Number(v))}
            options={estadoOptions}
            placeholder={t('alquileres.flota.cambiarEstado.seleccionar')}
            required
          />
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button
          type="button"
          variant="ghost"
          onClick={handleClose}
          disabled={isLoading}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || nuevoEstado === ''}
        >
          {isLoading ? t('common.saving') : t('alquileres.flota.cambiarEstado.confirmar')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
