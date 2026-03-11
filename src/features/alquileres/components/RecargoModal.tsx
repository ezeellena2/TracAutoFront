import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal } from '@/shared/ui';
import { recargosApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import type { RecargoAlquilerDto, CreateRecargoRequest } from '../types/recargo';
import {
  RecargoForm,
  validateRecargoForm,
  INITIAL_RECARGO_FORM,
} from './RecargoForm';
import type { RecargoFormState, RecargoFormErrors } from './RecargoForm';

interface RecargoModalProps {
  isOpen: boolean;
  recargo: RecargoAlquilerDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecargoModal({ isOpen, recargo, onClose, onSuccess }: RecargoModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [form, setForm] = useState<RecargoFormState>({ ...INITIAL_RECARGO_FORM });
  const [errors, setErrors] = useState<RecargoFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = recargo !== null;

  useEffect(() => {
    if (isOpen && recargo) {
      setForm({
        tipoRecargo: recargo.tipoRecargo,
        nombre: recargo.nombre,
        descripcion: recargo.descripcion ?? '',
        precioFijo: recargo.precioFijo !== null ? String(recargo.precioFijo) : '',
        precioPorDia: recargo.precioPorDia !== null ? String(recargo.precioPorDia) : '',
        porcentajeSobreTotal: recargo.porcentajeSobreTotal !== null ? String(recargo.porcentajeSobreTotal) : '',
        obligatorio: recargo.obligatorio,
        categoriaAlquiler: recargo.categoriaAlquiler !== null ? String(recargo.categoriaAlquiler) : '',
      });
    } else if (isOpen && !recargo) {
      setForm({ ...INITIAL_RECARGO_FORM });
    }
  }, [isOpen, recargo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateRecargoForm(form, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setApiError(null);

    try {
      const request: CreateRecargoRequest = {
        tipoRecargo: form.tipoRecargo,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precioFijo: form.precioFijo.trim() ? parseFloat(form.precioFijo) : null,
        precioPorDia: form.precioPorDia.trim() ? parseFloat(form.precioPorDia) : null,
        porcentajeSobreTotal: form.porcentajeSobreTotal.trim() ? parseFloat(form.porcentajeSobreTotal) : null,
        obligatorio: form.obligatorio,
        categoriaAlquiler: form.categoriaAlquiler ? Number(form.categoriaAlquiler) : null,
      };

      if (isEditMode) {
        await recargosApi.update(recargo.id, { ...request, id: recargo.id });
        toast.success(t('alquileres.recargos.editado'));
      } else {
        await recargosApi.create(request);
        toast.success(t('alquileres.recargos.agregado'));
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
    setForm({ ...INITIAL_RECARGO_FORM });
    setErrors({});
    setApiError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">
            {isEditMode ? t('alquileres.recargos.acciones.editar') : t('alquileres.recargos.agregar')}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <RecargoForm
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
