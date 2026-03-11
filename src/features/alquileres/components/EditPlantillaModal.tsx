import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, Input, Button, ApiErrorBanner, Spinner } from '@/shared/ui';
import { contratosApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import { EditorPlantilla } from './EditorPlantilla';

interface EditPlantillaModalProps {
  isOpen: boolean;
  plantillaId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface PlantillaFormState {
  nombre: string;
  esDefault: boolean;
  activa: boolean;
  contenidoHtml: string;
}

interface PlantillaFormErrors {
  nombre?: string;
  contenidoHtml?: string;
}

export function EditPlantillaModal({ isOpen, plantillaId, onClose, onSuccess }: EditPlantillaModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [form, setForm] = useState<PlantillaFormState | null>(null);
  const [errors, setErrors] = useState<PlantillaFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!plantillaId || !isOpen) return;
    setIsLoadingDetalle(true);
    setApiError(null);
    setErrors({});

    contratosApi.getPlantillaById(plantillaId)
      .then(detalle => {
        setForm({
          nombre: detalle.nombre,
          esDefault: detalle.esDefault,
          activa: detalle.activa,
          contenidoHtml: detalle.contenidoHtml,
        });
      })
      .catch(err => {
        const parsed = handleApiError(err, { showToast: false });
        setApiError(parsed);
      })
      .finally(() => setIsLoadingDetalle(false));
  }, [plantillaId, isOpen, handleApiError]);

  const validate = (): PlantillaFormErrors => {
    if (!form) return {};
    const errs: PlantillaFormErrors = {};
    if (!form.nombre.trim()) errs.nombre = t('alquileres.contratos.form.nombreRequerido');
    if (!form.contenidoHtml.trim()) errs.contenidoHtml = t('alquileres.contratos.form.contenidoRequerido');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !plantillaId) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setApiError(null);

    try {
      await contratosApi.actualizarPlantilla(plantillaId, {
        nombre: form.nombre.trim(),
        contenidoHtml: form.contenidoHtml,
        esDefault: form.esDefault,
        activa: form.activa,
      });
      toast.success(t('alquileres.contratos.editada'));
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
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
      <div className="p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">{t('alquileres.contratos.editar')}</h2>
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
          <ApiErrorBanner error={apiError} jiraLabel="Error edición plantilla" onReportClick={handleClose} />
        )}

        {!isLoadingDetalle && form && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <ApiErrorBanner error={apiError} jiraLabel="Error edición plantilla" onReportClick={handleClose} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label={t('alquileres.contratos.form.nombre')}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder={t('alquileres.contratos.form.nombrePlaceholder')}
                error={errors.nombre}
                maxLength={200}
                required
              />
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.esDefault}
                    onChange={(e) => setForm({ ...form, esDefault: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text">
                    {t('alquileres.contratos.form.esDefault')}
                  </span>
                </label>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.activa}
                    onChange={(e) => setForm({ ...form, activa: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text">
                    {t('alquileres.contratos.form.activa')}
                  </span>
                </label>
              </div>
            </div>

            {/* Editor HTML + placeholders */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                {t('alquileres.contratos.form.contenidoHtml')}
              </label>
              {errors.contenidoHtml && (
                <p className="text-sm text-error mb-2">{errors.contenidoHtml}</p>
              )}
              <EditorPlantilla
                value={form.contenidoHtml}
                onChange={(html) => setForm({ ...form, contenidoHtml: html })}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
