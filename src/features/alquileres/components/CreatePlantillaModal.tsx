import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, Input, Button, ApiErrorBanner } from '@/shared/ui';
import { contratosApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import { EditorPlantilla } from './EditorPlantilla';

interface CreatePlantillaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PlantillaFormErrors {
  nombre?: string;
  contenidoHtml?: string;
}

export function CreatePlantillaModal({ isOpen, onClose, onSuccess }: CreatePlantillaModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [nombre, setNombre] = useState('');
  const [esDefault, setEsDefault] = useState(false);
  const [contenidoHtml, setContenidoHtml] = useState('');
  const [errors, setErrors] = useState<PlantillaFormErrors>({});
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): PlantillaFormErrors => {
    const errs: PlantillaFormErrors = {};
    if (!nombre.trim()) errs.nombre = t('alquileres.contratos.form.nombreRequerido');
    if (!contenidoHtml.trim()) errs.contenidoHtml = t('alquileres.contratos.form.contenidoRequerido');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setApiError(null);

    try {
      await contratosApi.crearPlantilla({
        nombre: nombre.trim(),
        contenidoHtml: contenidoHtml,
        esDefault,
      });
      toast.success(t('alquileres.contratos.creada'));
      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const parsed = handleApiError(err, { showToast: false });
      setApiError(parsed);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNombre('');
    setEsDefault(false);
    setContenidoHtml('');
    setErrors({});
    setApiError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
      <div className="p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">{t('alquileres.contratos.crear')}</h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <ApiErrorBanner error={apiError} jiraLabel="Error creación plantilla" onReportClick={handleClose} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('alquileres.contratos.form.nombre')}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t('alquileres.contratos.form.nombrePlaceholder')}
              error={errors.nombre}
              maxLength={200}
              required
            />
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={esDefault}
                  onChange={(e) => setEsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text">
                  {t('alquileres.contratos.form.esDefault')}
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
            <EditorPlantilla value={contenidoHtml} onChange={setContenidoHtml} />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? t('common.creating') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
