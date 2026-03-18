import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal } from '@/shared/ui';
import { sucursalesApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import type { CreateSucursalRequest } from '../types/sucursal';
import { SucursalForm, getDefaultHorarios, validateSucursalForm } from './SucursalForm';
import type { SucursalFormState, SucursalFormErrors } from './SucursalForm';

interface CreateSucursalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INITIAL_FORM: SucursalFormState = {
  nombre: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigoPostal: '',
  telefono: '',
  email: '',
  permiteOneWay: false,
  notas: '',
  horarios: getDefaultHorarios(),
};

export function CreateSucursalModal({ isOpen, onClose, onSuccess }: CreateSucursalModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  // Inicialización lazy para evitar llamar getDefaultHorarios() en cada render
  const [form, setForm] = useState<SucursalFormState>(() => ({ ...INITIAL_FORM, horarios: getDefaultHorarios() }));
  const [errors, setErrors] = useState<SucursalFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateSucursalForm(form, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setApiError(null);

    try {
      const request: CreateSucursalRequest = {
        nombre: form.nombre.trim(),
        direccion: form.direccion.trim(),
        ciudad: form.ciudad.trim(),
        provincia: form.provincia.trim(),
        codigoPostal: form.codigoPostal.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        email: form.email.trim() || undefined,
        permiteOneWay: form.permiteOneWay,
        notas: form.notas.trim() || undefined,
        horarios: form.horarios,
      };
      await sucursalesApi.create(request);
      toast.success(t('alquileres.sucursales.creada'));
      setForm({ ...INITIAL_FORM, horarios: getDefaultHorarios() });
      setErrors({});
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
    setForm({ ...INITIAL_FORM, horarios: getDefaultHorarios() });
    setErrors({});
    setApiError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">{t('alquileres.sucursales.crear')}</h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <SucursalForm
          form={form}
          errors={errors}
          apiError={apiError}
          isSubmitting={isLoading}
          submitLabel={t('common.create')}
          submittingLabel={t('common.creating')}
          jiraLabel="Error creación sucursal"
          onFormChange={setForm}
          onSubmit={handleSubmit}
          onClose={handleClose}
          checkboxId="permiteOneWay"
        />
      </div>
    </Modal>
  );
}
