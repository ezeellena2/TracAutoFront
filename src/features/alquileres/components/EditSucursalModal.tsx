import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, ApiErrorBanner, Spinner } from '@/shared/ui';
import { sucursalesApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import { SucursalForm, DIAS_ORDEN, validateSucursalForm } from './SucursalForm';
import type { SucursalFormState, SucursalFormErrors } from './SucursalForm';

interface EditSucursalModalProps {
  isOpen: boolean;
  sucursalId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSucursalModal({ isOpen, sucursalId, onClose, onSuccess }: EditSucursalModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [form, setForm] = useState<SucursalFormState | null>(null);
  const [errors, setErrors] = useState<SucursalFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar detalle cuando cambia sucursalId
  useEffect(() => {
    if (!sucursalId || !isOpen) return;
    setIsLoadingDetalle(true);
    setApiError(null);
    setErrors({});

    sucursalesApi.getById(sucursalId)
      .then(detalle => {
        // Ordenar horarios segun DIAS_ORDEN
        const horariosOrdenados = DIAS_ORDEN.map(dia => {
          const encontrado = detalle.horarios.find(h => h.diaSemana === dia);
          return encontrado ?? { diaSemana: dia, horaApertura: '08:00:00', horaCierre: '18:00:00', cerrado: true };
        });
        setForm({
          nombre: detalle.nombre,
          direccion: detalle.direccion,
          ciudad: detalle.ciudad,
          provincia: detalle.provincia,
          codigoPostal: detalle.codigoPostal ?? '',
          telefono: detalle.telefono ?? '',
          email: detalle.email ?? '',
          permiteOneWay: detalle.permiteOneWay,
          notas: detalle.notas ?? '',
          horarios: horariosOrdenados,
        });
      })
      .catch(err => {
        const parsed = handleApiError(err, { showToast: false });
        setApiError(parsed);
      })
      .finally(() => setIsLoadingDetalle(false));
  }, [sucursalId, isOpen, handleApiError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !sucursalId) return;

    const validationErrors = validateSucursalForm(form, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setApiError(null);

    try {
      await sucursalesApi.update(sucursalId, {
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
      });
      toast.success(t('alquileres.sucursales.editada'));
      setApiError(null);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const parsed = handleApiError(err, { showToast: false });
      setApiError(parsed);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h2 className="text-xl font-semibold text-text">{t('alquileres.sucursales.editar')}</h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        {isLoadingDetalle && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {!isLoadingDetalle && !form && apiError && (
          <ApiErrorBanner error={apiError} jiraLabel="Error edición sucursal" onReportClick={handleClose} />
        )}

        {!isLoadingDetalle && form && (
          <SucursalForm
            form={form}
            errors={errors}
            apiError={apiError}
            isSubmitting={isSubmitting}
            submitLabel={t('common.save')}
            submittingLabel={t('common.saving')}
            jiraLabel="Error edición sucursal"
            onFormChange={setForm}
            onSubmit={handleSubmit}
            onClose={handleClose}
            checkboxId="permiteOneWayEdit"
          />
        )}
      </div>
    </Modal>
  );
}
