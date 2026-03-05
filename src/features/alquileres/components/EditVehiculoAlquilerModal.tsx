import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, ApiErrorBanner, Spinner } from '@/shared/ui';
import { vehiculosAlquilerApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import type { SucursalDto } from '../types/sucursal';
import type { UpdateVehiculoAlquilerRequest } from '../types/vehiculoAlquiler';
import { VehiculoAlquilerForm, validateVehiculoAlquilerForm } from './VehiculoAlquilerForm';
import type { VehiculoAlquilerFormState, VehiculoAlquilerFormErrors } from './VehiculoAlquilerForm';

interface EditVehiculoAlquilerModalProps {
  isOpen: boolean;
  vehiculoAlquilerId: string | null;
  sucursales: SucursalDto[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditVehiculoAlquilerModal({
  isOpen,
  vehiculoAlquilerId,
  sucursales,
  onClose,
  onSuccess,
}: EditVehiculoAlquilerModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [form, setForm] = useState<VehiculoAlquilerFormState | null>(null);
  const [errors, setErrors] = useState<VehiculoAlquilerFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar detalle al abrir
  useEffect(() => {
    if (!vehiculoAlquilerId || !isOpen) return;
    setIsLoadingDetalle(true);
    setApiError(null);
    setErrors({});

    vehiculosAlquilerApi.getById(vehiculoAlquilerId)
      .then(detalle => {
        setForm({
          vehiculoId: detalle.vehiculoId,
          vehiculoLabel: `${detalle.patente} — ${detalle.marca ?? ''} ${detalle.modelo ?? ''} ${detalle.anio ?? ''}`.trim(),
          categoriaAlquiler: detalle.categoriaAlquiler,
          precioBaseDiario: String(detalle.precioBaseDiario),
          depositoMinimo: String(detalle.depositoMinimo),
          kilometrajeLimiteDiario: detalle.kilometrajeLimiteDiario != null
            ? String(detalle.kilometrajeLimiteDiario)
            : '',
          precioPorKmExcedente: String(detalle.precioPorKmExcedente),
          politicaCombustible: detalle.politicaCombustible,
          edadMinimaConductor: String(detalle.edadMinimaConductor),
          licenciaRequerida: detalle.licenciaRequerida,
          sucursalPorDefectoId: detalle.sucursalPorDefectoId,
          sucursalIds: detalle.sucursales.map(s => s.sucursalId),
        });
      })
      .catch(err => {
        const parsed = handleApiError(err, { showToast: false });
        setApiError(parsed);
      })
      .finally(() => {
        setIsLoadingDetalle(false);
      });
  }, [vehiculoAlquilerId, isOpen, handleApiError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !vehiculoAlquilerId) return;

    const validationErrors = validateVehiculoAlquilerForm(form, t, true);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setApiError(null);

    try {
      const request: UpdateVehiculoAlquilerRequest = {
        id: vehiculoAlquilerId,
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
      await vehiculosAlquilerApi.update(vehiculoAlquilerId, request);
      toast.success(t('alquileres.flota.editado'));
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
          <h2 className="text-xl font-semibold text-text">{t('alquileres.flota.editar')}</h2>
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
          <ApiErrorBanner error={apiError} jiraLabel="Error edición vehículo alquiler" onReportClick={handleClose} />
        )}

        {!isLoadingDetalle && form && (
          <VehiculoAlquilerForm
            form={form}
            errors={errors}
            apiError={apiError}
            isSubmitting={isSubmitting}
            isEditMode={true}
            submitLabel={t('common.save')}
            submittingLabel={t('common.saving')}
            jiraLabel="Error edición vehículo alquiler"
            sucursalesDisponibles={sucursales}
            sucursalesLoading={false}
            onFormChange={setForm}
            onSubmit={handleSubmit}
            onClose={handleClose}
          />
        )}
      </div>
    </Modal>
  );
}
