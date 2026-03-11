import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Modal, ApiErrorBanner, Spinner } from '@/shared/ui';
import { clientesAlquilerApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import { ClienteForm, validateClienteForm } from './ClienteForm';
import type { ClienteFormState, ClienteFormErrors } from './ClienteForm';

interface EditClienteModalProps {
  isOpen: boolean;
  clienteId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditClienteModal({ isOpen, clienteId, onClose, onSuccess }: EditClienteModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ClienteFormState | null>(null);
  const [errors, setErrors] = useState<ClienteFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);

  const { data: detalle, isLoading: isLoadingDetalle, error: fetchError } = useQuery({
    queryKey: ['cliente-alquiler-detalle', clienteId],
    queryFn: () => clientesAlquilerApi.getById(clienteId!),
    enabled: isOpen && !!clienteId,
  });

  useEffect(() => {
    if (!detalle) return;
    setForm({
      nombre: detalle.nombre,
      apellido: detalle.apellido,
      email: detalle.email,
      telefono: detalle.telefono ?? '',
      tipoDocumento: detalle.tipoDocumento,
      numeroDocumento: detalle.numeroDocumento,
      fechaNacimiento: detalle.fechaNacimiento ?? '',
      direccion: detalle.direccion ?? '',
      ciudad: detalle.ciudad ?? '',
      provincia: detalle.provincia ?? '',
      codigoPostal: detalle.codigoPostal ?? '',
      numeroLicenciaConducir: detalle.numeroLicenciaConducir ?? '',
      vencimientoLicencia: detalle.vencimientoLicencia ?? '',
      notas: detalle.notas ?? '',
    });
    setErrors({});
    setApiError(null);
  }, [detalle]);

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: Record<string, unknown> }) =>
      clientesAlquilerApi.update(data.id, data.body),
    onSuccess: () => {
      toast.success(t('alquileres.clientes.editado'));
      queryClient.invalidateQueries({ queryKey: ['clientes-alquiler'] });
      queryClient.invalidateQueries({ queryKey: ['cliente-alquiler-detalle', clienteId] });
      onSuccess();
      onClose();
    },
    onError: (err: unknown) => {
      const parsed = handleApiError(err, { showToast: false });
      setApiError(parsed);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !clienteId) return;

    const validationErrors = validateClienteForm(form, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setApiError(null);

    updateMutation.mutate({
      id: clienteId,
      body: {
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
      },
    });
  };

  const fetchErrorParsed = fetchError ? handleApiError(fetchError, { showToast: false }) : null;

  const handleClose = () => {
    setForm(null);
    setErrors({});
    setApiError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">{t('alquileres.clientes.editar')}</h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        {isLoadingDetalle && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {!isLoadingDetalle && !form && (fetchErrorParsed || apiError) && (
          <ApiErrorBanner error={fetchErrorParsed ?? apiError} jiraLabel="Error edición cliente" onReportClick={handleClose} />
        )}

        {!isLoadingDetalle && form && (
          <ClienteForm
            form={form}
            errors={errors}
            apiError={apiError}
            isSubmitting={updateMutation.isPending}
            submitLabel={t('common.save')}
            submittingLabel={t('common.saving')}
            jiraLabel="Error edición cliente"
            onFormChange={setForm}
            onSubmit={handleSubmit}
            onClose={handleClose}
          />
        )}
      </div>
    </Modal>
  );
}
