import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal } from '@/shared/ui';
import { coberturasApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import type { CoberturaAlquilerDto, CreateCoberturaRequest } from '../types/cobertura';
import {
  CoberturaForm,
  validateCoberturaForm,
  INITIAL_COBERTURA_FORM,
} from './CoberturaForm';
import type { CoberturaFormState, CoberturaFormErrors } from './CoberturaForm';

interface CoberturaModalProps {
  isOpen: boolean;
  cobertura: CoberturaAlquilerDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CoberturaModal({ isOpen, cobertura, onClose, onSuccess }: CoberturaModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [form, setForm] = useState<CoberturaFormState>({ ...INITIAL_COBERTURA_FORM });
  const [errors, setErrors] = useState<CoberturaFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = cobertura !== null;

  useEffect(() => {
    if (isOpen && cobertura) {
      setForm({
        nombre: cobertura.nombre,
        descripcion: cobertura.descripcion ?? '',
        precioPorDia: String(cobertura.precioPorDia),
        deducibleMaximo: String(cobertura.deducibleMaximo),
        cubreRobo: cobertura.cubreRobo,
        cubreVidrios: cobertura.cubreVidrios,
        cubreNeumaticos: cobertura.cubreNeumaticos,
        cubreGranizo: cobertura.cubreGranizo,
        obligatoria: cobertura.obligatoria,
      });
    } else if (isOpen && !cobertura) {
      setForm({ ...INITIAL_COBERTURA_FORM });
    }
  }, [isOpen, cobertura]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateCoberturaForm(form, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setApiError(null);

    try {
      const request: CreateCoberturaRequest = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precioPorDia: parseFloat(form.precioPorDia),
        deducibleMaximo: parseFloat(form.deducibleMaximo),
        cubreRobo: form.cubreRobo,
        cubreVidrios: form.cubreVidrios,
        cubreNeumaticos: form.cubreNeumaticos,
        cubreGranizo: form.cubreGranizo,
        obligatoria: form.obligatoria,
      };

      if (isEditMode) {
        await coberturasApi.update(cobertura.id, { ...request, id: cobertura.id });
        toast.success(t('alquileres.coberturas.editado'));
      } else {
        await coberturasApi.create(request);
        toast.success(t('alquileres.coberturas.agregado'));
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
    setForm({ ...INITIAL_COBERTURA_FORM });
    setErrors({});
    setApiError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">
            {isEditMode ? t('alquileres.coberturas.acciones.editar') : t('alquileres.coberturas.agregar')}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <CoberturaForm
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
