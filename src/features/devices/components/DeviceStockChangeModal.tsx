import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '@/shared/ui';
import { dispositivosApi } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { DispositivoDto } from '@/shared/types/api';
import { EstadoStockDispositivo } from '@/shared/types/api';

interface DeviceStockChangeModalProps {
  device: DispositivoDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const stockStatusOptions = [
  { value: EstadoStockDispositivo.EnStock, labelKey: 'devices.stock.status.enStock' },
  { value: EstadoStockDispositivo.Instalado, labelKey: 'devices.stock.status.instalado' },
  { value: EstadoStockDispositivo.EnReparacion, labelKey: 'devices.stock.status.enReparacion' },
  { value: EstadoStockDispositivo.DadoDeBaja, labelKey: 'devices.stock.status.dadoDeBaja' },
];

export function DeviceStockChangeModal({ device, isOpen, onClose, onSuccess }: DeviceStockChangeModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [nuevoEstado, setNuevoEstado] = useState<EstadoStockDispositivo>(
    device?.estadoStock ?? EstadoStockDispositivo.EnStock
  );
  const [nota, setNota] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!device) return null;

  const handleSubmit = async () => {
    if (nuevoEstado === device.estadoStock) {
      toast.error(t('devices.stock.sameStatusError'));
      return;
    }

    setIsSubmitting(true);
    try {
      await dispositivosApi.cambiarEstadoStock(device.id, {
        nuevoEstado,
        nota: nota.trim() || null,
      });
      toast.success(t('devices.stock.changeSuccess'));
      onSuccess();
      onClose();
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('devices.stock.changeTitle')}
    >
      <div className="space-y-5">
        {/* Device info */}
        <div className="p-3 bg-background rounded-lg border border-border">
          <p className="text-xs text-text-muted mb-1">{t('devices.qr.deviceName')}</p>
          <p className="text-sm font-medium text-text">{device.nombre}</p>
          {device.uniqueId && (
            <p className="text-xs text-text-muted mt-1 font-mono">{device.uniqueId}</p>
          )}
        </div>

        {/* Current stock state */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t('devices.stock.currentStatus')}
          </label>
          <p className="text-sm text-text-muted">
            {t(stockStatusOptions.find(o => o.value === device.estadoStock)?.labelKey ?? '')}
          </p>
        </div>

        {/* New stock state selector */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            {t('devices.stock.newStatus')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {stockStatusOptions
              .filter(o => o.value !== device.estadoStock)
              .map((option) => (
                <button
                  key={option.value}
                  onClick={() => setNuevoEstado(option.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all cursor-pointer ${
                    nuevoEstado === option.value
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-surface text-text hover:border-primary/50'
                  }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
          </div>
        </div>

        {/* Note field */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t('devices.stock.noteLabel')}
          </label>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder={t('devices.stock.notePlaceholder')}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text placeholder:text-text-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-text-muted mt-1">{nota.length}/500</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || nuevoEstado === device.estadoStock}
            isLoading={isSubmitting}
          >
            {t('devices.stock.confirmChange')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
