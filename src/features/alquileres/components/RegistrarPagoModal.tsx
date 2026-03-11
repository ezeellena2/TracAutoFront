import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, Input, Select, Button, ApiErrorBanner } from '@/shared/ui';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import { TipoPago, MetodoPago } from '../types/reserva';
import type { RegistrarPagoManualRequest } from '../types/reserva';

interface RegistrarPagoModalProps {
  isOpen: boolean;
  reservaId: string;
  moneda: string;
  onClose: () => void;
  onSubmit: (data: RegistrarPagoManualRequest) => Promise<void>;
}

export function RegistrarPagoModal({
  isOpen,
  reservaId,
  moneda,
  onClose,
  onSubmit,
}: RegistrarPagoModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();

  const [tipoPago, setTipoPago] = useState<number | ''>('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState<number | ''>('');
  const [referenciaExterna, setReferenciaExterna] = useState('');
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const tipoPagoOptions = Object.values(TipoPago)
    .filter((v): v is number => typeof v === 'number')
    .map(v => ({ value: v, label: t(`alquileres.reservaDetalle.tiposPago.${v}`) }));

  const metodoPagoOptions = Object.values(MetodoPago)
    .filter((v): v is number => typeof v === 'number')
    .map(v => ({ value: v, label: t(`alquileres.reservaDetalle.metodosPago.${v}`) }));

  const resetForm = () => {
    setTipoPago('');
    setMonto('');
    setMetodoPago('');
    setReferenciaExterna('');
    setApiError(null);
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isValid =
    tipoPago !== '' &&
    monto !== '' &&
    Number(monto) > 0 &&
    metodoPago !== '';

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsLoading(true);
    setApiError(null);

    try {
      await onSubmit({
        reservaAlquilerId: reservaId,
        tipoPago: tipoPago as number,
        monto: Number(monto),
        moneda,
        metodoPago: metodoPago as number,
        referenciaExterna: referenciaExterna.trim() || undefined,
        claveIdempotencia: crypto.randomUUID(),
      });
      resetForm();
      onClose();
    } catch (err: unknown) {
      const parsed = handleApiError(err, { showToast: false });
      setApiError(parsed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-text">
            {t('alquileres.reservaDetalle.pagos.registrar')}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <ApiErrorBanner error={apiError} jiraLabel="Error registrar pago" onReportClick={handleClose} />

        <div className="space-y-4">
          <Select
            label={t('alquileres.reservaDetalle.form.tipoPago')}
            value={tipoPago}
            onChange={(v) => setTipoPago(Number(v))}
            options={tipoPagoOptions}
            placeholder={t('alquileres.reservaDetalle.form.tipoPagoPlaceholder')}
            required
          />

          <Input
            label={t('alquileres.reservaDetalle.form.monto')}
            type="number"
            min={0}
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />

          <Select
            label={t('alquileres.reservaDetalle.form.metodoPago')}
            value={metodoPago}
            onChange={(v) => setMetodoPago(Number(v))}
            options={metodoPagoOptions}
            placeholder={t('alquileres.reservaDetalle.form.metodoPagoPlaceholder')}
            required
          />

          <Input
            label={t('alquileres.reservaDetalle.form.referenciaExterna')}
            value={referenciaExterna}
            onChange={(e) => setReferenciaExterna(e.target.value)}
            placeholder={t('alquileres.reservaDetalle.form.referenciaPlaceholder')}
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
              disabled={isLoading || !isValid}
              className="flex-1"
            >
              {isLoading ? t('common.saving') : t('alquileres.reservaDetalle.form.confirmar')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
