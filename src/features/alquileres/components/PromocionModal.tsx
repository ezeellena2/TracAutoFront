import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal } from '@/shared/ui';
import { promocionesApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import type { PromocionAlquilerDto, CreatePromocionRequest } from '../types/promocion';
import {
  PromocionForm,
  validatePromocionForm,
  INITIAL_PROMOCION_FORM,
} from './PromocionForm';
import type { PromocionFormState, PromocionFormErrors } from './PromocionForm';

interface PromocionModalProps {
  isOpen: boolean;
  promocion: PromocionAlquilerDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PromocionModal({ isOpen, promocion, onClose, onSuccess }: PromocionModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [form, setForm] = useState<PromocionFormState>({ ...INITIAL_PROMOCION_FORM });
  const [errors, setErrors] = useState<PromocionFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = promocion !== null;

  useEffect(() => {
    if (isOpen && promocion) {
      setForm({
        codigo: promocion.codigo,
        descripcion: promocion.descripcion ?? '',
        tipoDescuento: promocion.tipoDescuento,
        valorDescuento: String(promocion.valorDescuento),
        vigenciaDesde: promocion.vigenciaDesde.split('T')[0],
        vigenciaHasta: promocion.vigenciaHasta.split('T')[0],
        usosMaximos: promocion.usosMaximos !== null ? String(promocion.usosMaximos) : '',
        montoMinimoReserva: promocion.montoMinimoReserva !== null ? String(promocion.montoMinimoReserva) : '',
      });
    } else if (isOpen && !promocion) {
      setForm({ ...INITIAL_PROMOCION_FORM });
    }
  }, [isOpen, promocion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validatePromocionForm(form, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setApiError(null);

    try {
      const request: CreatePromocionRequest = {
        codigo: form.codigo.trim(),
        descripcion: form.descripcion.trim() || null,
        tipoDescuento: form.tipoDescuento,
        valorDescuento: parseFloat(form.valorDescuento),
        vigenciaDesde: form.vigenciaDesde,
        vigenciaHasta: form.vigenciaHasta,
        usosMaximos: form.usosMaximos.trim() ? parseInt(form.usosMaximos, 10) : null,
        montoMinimoReserva: form.montoMinimoReserva.trim() ? parseFloat(form.montoMinimoReserva) : null,
      };

      if (isEditMode) {
        await promocionesApi.update(promocion.id, { ...request, id: promocion.id });
        toast.success(t('alquileres.promociones.editado'));
      } else {
        await promocionesApi.create(request);
        toast.success(t('alquileres.promociones.agregado'));
      }

      handleClose();
      onSuccess();
    } catch (err: unknown) {
      const parsed = handleApiError(err, { showToast: false });
      setApiError(parsed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ ...INITIAL_PROMOCION_FORM });
    setErrors({});
    setApiError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">
            {isEditMode ? t('alquileres.promociones.acciones.editar') : t('alquileres.promociones.agregar')}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <PromocionForm
          form={form}
          errors={errors}
          apiError={apiError}
          isSubmitting={isLoading}
          isEditMode={isEditMode}
          submitLabel={isEditMode ? t('common.save') : t('common.create')}
          submittingLabel={isEditMode ? t('common.saving') : t('common.creating')}
          onFormChange={setForm}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      </div>
    </Modal>
  );
}
