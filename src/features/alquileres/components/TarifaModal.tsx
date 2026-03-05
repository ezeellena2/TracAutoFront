import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal } from '@/shared/ui';
import { tarifasApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import type { SucursalDto } from '../types/sucursal';
import type { TarifaAlquilerDto, CreateTarifaRequest } from '../types/tarifa';
import {
  TarifaForm,
  validateTarifaForm,
  INITIAL_TARIFA_FORM,
} from './TarifaForm';
import type { TarifaFormState, TarifaFormErrors } from './TarifaForm';

interface TarifaModalProps {
  isOpen: boolean;
  tarifa: TarifaAlquilerDto | null;
  sucursales: SucursalDto[];
  onClose: () => void;
  onSuccess: () => void;
}

export function TarifaModal({ isOpen, tarifa, sucursales, onClose, onSuccess }: TarifaModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [form, setForm] = useState<TarifaFormState>({ ...INITIAL_TARIFA_FORM });
  const [errors, setErrors] = useState<TarifaFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = tarifa !== null;

  // Pre-cargar formulario cuando se abre en modo edición
  useEffect(() => {
    if (isOpen && tarifa) {
      setForm({
        nombre: tarifa.nombre,
        categoriaAlquiler: tarifa.categoriaAlquiler !== null ? String(tarifa.categoriaAlquiler) : '',
        sucursalId: tarifa.sucursalId ?? '',
        unidadTiempo: tarifa.unidadTiempo,
        precioPorUnidad: String(tarifa.precioPorUnidad),
        moneda: tarifa.moneda,
        vigenciaDesde: tarifa.vigenciaDesde.split('T')[0],
        vigenciaHasta: tarifa.vigenciaHasta.split('T')[0],
        duracionMinimaDias: tarifa.duracionMinimaDias !== null ? String(tarifa.duracionMinimaDias) : '',
        duracionMaximaDias: tarifa.duracionMaximaDias !== null ? String(tarifa.duracionMaximaDias) : '',
        prioridad: String(tarifa.prioridad),
      });
    } else if (isOpen && !tarifa) {
      setForm({ ...INITIAL_TARIFA_FORM });
    }
  }, [isOpen, tarifa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateTarifaForm(form, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setApiError(null);

    try {
      const request: CreateTarifaRequest = {
        nombre: form.nombre.trim(),
        categoriaAlquiler: form.categoriaAlquiler ? Number(form.categoriaAlquiler) : null,
        sucursalId: form.sucursalId || null,
        unidadTiempo: form.unidadTiempo,
        precioPorUnidad: parseFloat(form.precioPorUnidad),
        moneda: form.moneda.trim(),
        vigenciaDesde: form.vigenciaDesde,
        vigenciaHasta: form.vigenciaHasta,
        duracionMinimaDias: form.duracionMinimaDias.trim() ? parseInt(form.duracionMinimaDias, 10) : null,
        duracionMaximaDias: form.duracionMaximaDias.trim() ? parseInt(form.duracionMaximaDias, 10) : null,
        prioridad: parseInt(form.prioridad, 10),
      };

      if (isEditMode) {
        await tarifasApi.update(tarifa.id, { ...request, id: tarifa.id });
        toast.success(t('alquileres.tarifas.editado'));
      } else {
        await tarifasApi.create(request);
        toast.success(t('alquileres.tarifas.agregado'));
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
    setForm({ ...INITIAL_TARIFA_FORM });
    setErrors({});
    setApiError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">
            {isEditMode ? t('alquileres.tarifas.acciones.editar') : t('alquileres.tarifas.agregar')}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <TarifaForm
          form={form}
          errors={errors}
          apiError={apiError}
          isSubmitting={isLoading}
          isEditMode={isEditMode}
          submitLabel={isEditMode ? t('common.save') : t('common.create')}
          submittingLabel={isEditMode ? t('common.saving') : t('common.creating')}
          sucursales={sucursales}
          onFormChange={setForm}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      </div>
    </Modal>
  );
}
