import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from '@/shared/ui';

interface CancelarReservaClienteModalProps {
  isOpen: boolean;
  numeroReserva: string;
  onClose: () => void;
  onConfirm: (motivo?: string) => void;
  isLoading: boolean;
}

export function CancelarReservaClienteModal({
  isOpen,
  numeroReserva,
  onClose,
  onConfirm,
  isLoading,
}: CancelarReservaClienteModalProps) {
  const { t } = useTranslation();
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMotivo('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(motivo.trim() || undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" ariaLabelledBy="cancelar-reserva-titulo">
      <div className="p-6">
        <h2 id="cancelar-reserva-titulo" className="text-lg font-semibold text-text mb-2">
          {t('alquilerPublico.misReservas.cancelar.titulo')}
        </h2>
        <p className="text-sm text-text-muted mb-4">
          {t('alquilerPublico.misReservas.cancelar.subtitulo', { numero: numeroReserva })}
        </p>

        {/* Advertencia de penalizacion */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20 mb-4">
          <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-warning">
            {t('alquilerPublico.misReservas.cancelar.advertencia')}
          </p>
        </div>

        {/* Motivo (opcional) */}
        <div className="space-y-1.5 mb-6">
          <label className="text-sm font-medium text-text block">
            {t('alquilerPublico.misReservas.cancelar.motivo')}
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={t('alquilerPublico.misReservas.cancelar.motivoPlaceholder')}
            maxLength={1000}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm resize-none"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleConfirm} isLoading={isLoading}>
            {t('alquilerPublico.misReservas.cancelar.confirmar')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
