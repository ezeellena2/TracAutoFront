import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal } from '@/shared/ui';
import { vehiculosAlquilerApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import type { SucursalDto } from '../types/sucursal';
import type { AddVehiculoAlquilerRequest } from '../types/vehiculoAlquiler';
import {
  VehiculoAlquilerForm,
  validateVehiculoAlquilerForm,
  INITIAL_VEHICULO_FORM,
} from './VehiculoAlquilerForm';
import type { VehiculoAlquilerFormState, VehiculoAlquilerFormErrors } from './VehiculoAlquilerForm';

interface CreateVehiculoAlquilerModalProps {
  isOpen: boolean;
  sucursales: SucursalDto[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateVehiculoAlquilerModal({ isOpen, sucursales, onClose, onSuccess }: CreateVehiculoAlquilerModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [form, setForm] = useState<VehiculoAlquilerFormState>({ ...INITIAL_VEHICULO_FORM });
  const [errors, setErrors] = useState<VehiculoAlquilerFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateVehiculoAlquilerForm(form, t, false);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setApiError(null);

    try {
      const request: AddVehiculoAlquilerRequest = {
        vehiculoId: form.vehiculoId,
        categoriaAlquiler: form.categoriaAlquiler,
        precioBaseDiario: parseFloat(form.precioBaseDiario),
        depositoMinimo: parseFloat(form.depositoMinimo),
        kilometrajeLimiteDiario: form.kilometrajeLimiteDiario.trim()
          ? parseInt(form.kilometrajeLimiteDiario, 10)
          : null,
        precioPorKmExcedente: parseFloat(form.precioPorKmExcedente),
        politicaCombustible: form.politicaCombustible,
        edadMinimaConductor: parseInt(form.edadMinimaConductor, 10),
        licenciaRequerida: form.licenciaRequerida.trim(),
        sucursalPorDefectoId: form.sucursalPorDefectoId,
        sucursalIds: form.sucursalIds,
      };
      await vehiculosAlquilerApi.add(request);
      toast.success(t('alquileres.flota.agregado'));
      setForm({ ...INITIAL_VEHICULO_FORM });
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
    setForm({ ...INITIAL_VEHICULO_FORM });
    setErrors({});
    setApiError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">{t('alquileres.flota.agregar')}</h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <VehiculoAlquilerForm
          form={form}
          errors={errors}
          apiError={apiError}
          isSubmitting={isLoading}
          isEditMode={false}
          submitLabel={t('common.create')}
          submittingLabel={t('common.creating')}
          jiraLabel="Error agregar vehículo alquiler"
          sucursalesDisponibles={sucursales}
          sucursalesLoading={false}
          onFormChange={setForm}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      </div>
    </Modal>
  );
}
