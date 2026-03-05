import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '@/shared/ui';
import type { ReservaAlquilerResumenDto } from '../types/reserva';

interface CancelarReservaModalProps {
  isOpen: boolean;
  reserva: ReservaAlquilerResumenDto | null;
  onClose: () => void;
  onConfirm: (motivoCancelacion: string) => void;
  isLoading: boolean;
}

export function CancelarReservaModal({ isOpen, reserva, onClose, onConfirm, isLoading }: CancelarReservaModalProps) {
  const { t } = useTranslation();
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMotivo('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!motivo.trim()) {
      setError(t('alquileres.reservas.cancelar.motivoRequerido'));
      return;
    }
    setError('');
    onConfirm(motivo.trim());
  };

  if (!reserva) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-text mb-4">
          {t('alquileres.reservas.cancelar.titulo', { numero: reserva.numeroReserva })}
        </h2>

        <div className="space-y-1.5 mb-6">
          <label className="text-sm font-medium text-text block">
            {t('alquileres.reservas.cancelar.motivo')}
          </label>
          <textarea
            value={motivo}
            onChange={(e) => { setMotivo(e.target.value); setError(''); }}
            placeholder={t('alquileres.reservas.cancelar.motivoPlaceholder')}
            maxLength={1000}
            rows={4}
            className={`w-full px-3 py-2 rounded-lg bg-background border text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm resize-none ${
              error ? 'border-error' : 'border-border'
            }`}
          />
          {error && <p className="text-error text-xs">{error}</p>}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleConfirm} isLoading={isLoading}>
            {t('alquileres.reservas.cancelar.confirmarCancelacion')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
