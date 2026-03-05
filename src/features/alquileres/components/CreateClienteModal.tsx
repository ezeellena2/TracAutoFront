import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal } from '@/shared/ui';
import { clientesAlquilerApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import type { CreateClienteAlquilerRequest } from '../types/cliente';
import { ClienteForm, INITIAL_CLIENTE_FORM, validateClienteForm } from './ClienteForm';
import type { ClienteFormState, ClienteFormErrors } from './ClienteForm';

interface CreateClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateClienteModal({ isOpen, onClose, onSuccess }: CreateClienteModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [form, setForm] = useState<ClienteFormState>({ ...INITIAL_CLIENTE_FORM });
  const [errors, setErrors] = useState<ClienteFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateClienteForm(form, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setApiError(null);

    try {
      const request: CreateClienteAlquilerRequest = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() || undefined,
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento.trim(),
        fechaNacimiento: form.fechaNacimiento || undefined,
        direccion: form.direccion.trim() || undefined,
        ciudad: form.ciudad.trim() || undefined,
        provincia: form.provincia.trim() || undefined,
        codigoPostal: form.codigoPostal.trim() || undefined,
        numeroLicenciaConducir: form.numeroLicenciaConducir.trim() || undefined,
        vencimientoLicencia: form.vencimientoLicencia || undefined,
        notas: form.notas.trim() || undefined,
      };
      await clientesAlquilerApi.create(request);
      toast.success(t('alquileres.clientes.creado'));
      setForm({ ...INITIAL_CLIENTE_FORM });
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
    setForm({ ...INITIAL_CLIENTE_FORM });
    setErrors({});
    setApiError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">{t('alquileres.clientes.crear')}</h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <ClienteForm
          form={form}
          errors={errors}
          apiError={apiError}
          isSubmitting={isLoading}
          submitLabel={t('common.create')}
          submittingLabel={t('common.creating')}
          jiraLabel="Error creación cliente"
          onFormChange={setForm}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      </div>
    </Modal>
  );
}
