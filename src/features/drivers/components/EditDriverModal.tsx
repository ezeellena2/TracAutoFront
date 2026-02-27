import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal, Input, Button, ApiErrorBanner } from '@/shared/ui';
import { conductoresApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler, type ParsedError } from '@/hooks';
import type { ConductorDto } from '../types';

interface EditDriverModalProps {
  isOpen: boolean;
  conductor: ConductorDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDriverModal({ isOpen, conductor, onClose, onSuccess }: EditDriverModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleApiError, parseError } = useErrorHandler();
  const [form, setForm] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
  });
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (conductor) {
      setForm({
        nombreCompleto: conductor.nombreCompleto,
        email: conductor.email || '',
        telefono: conductor.telefono || '',
      });
    }
  }, [conductor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conductor) return;

    setIsLoading(true);
    setApiError(null);

    try {
      await conductoresApi.actualizar(conductor.id, {
        nombreCompleto: form.nombreCompleto.trim(),
        email: form.email?.trim() || undefined,
        telefono: form.telefono?.trim() || undefined,
      });
      toast.success(t('drivers.success.updated'));
      setApiError(null);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const parsedError = parseError(err);

      // Para errores graves (500+), redirigir a la página de error
      if (parsedError.status >= 500) {
        navigate('/error', {
          state: { traceId: parsedError.traceId },
        });
        return;
      }

      // Para otros errores (validación, conflictos, etc.), mostrar toast
      toast.error(parsedError.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!conductor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">{t('drivers.editDriver')}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ApiErrorBanner
            error={apiError}
            jiraLabel={t('drivers.errors.updateFailed', 'Error al actualizar conductor')}
            onReportClick={onClose}
          />
          <Input
            label={t('drivers.form.fullNameLabel')}
            value={form.nombreCompleto}
            onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
            placeholder={t('drivers.form.fullNamePlaceholder')}
            required
          />
          {conductor.dni && (
            <Input
              label={t('drivers.form.dniLabel')}
              value={conductor.dni}
              disabled
              helperText={t('drivers.form.dniCannotModify')}
            />
          )}
          <Input
            label={t('drivers.form.emailLabel')}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t('drivers.form.emailPlaceholder')}
          />
          <Input
            label={t('drivers.form.phoneLabel')}
            type="tel"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder={t('drivers.form.phonePlaceholder')}
          />


          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
