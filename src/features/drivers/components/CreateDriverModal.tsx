import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, Input, Button, ApiErrorBanner } from '@/shared/ui';
import { conductoresApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type { CreateConductorCommand } from '../types';

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDriverModal({ isOpen, onClose, onSuccess }: CreateDriverModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [form, setForm] = useState<CreateConductorCommand>({
    nombreCompleto: '',
    dni: '',
    email: '',
    telefono: '',
  });
  const [errors, setErrors] = useState<{ nombreCompleto?: string }>({});
  const [apiError, setApiError] = useState<import('@/hooks').ParsedError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: { nombreCompleto?: string } = {};
    if (!form.nombreCompleto.trim()) {
      validationErrors.nombreCompleto = t('drivers.form.fullNameRequired');
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setApiError(null);

    try {
      await conductoresApi.crear({
        nombreCompleto: form.nombreCompleto.trim(),
        dni: form.dni?.trim() || undefined,
        email: form.email?.trim() || undefined,
        telefono: form.telefono?.trim() || undefined,
      });
      toast.success(t('drivers.success.created'));
      setForm({ nombreCompleto: '', dni: '', email: '', telefono: '' });
      setErrors({});
      setApiError(null);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const parsedError = handleApiError(err, { showToast: false });
      setApiError(parsedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ nombreCompleto: '', dni: '', email: '', telefono: '' });
    setErrors({});
    setApiError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">{t('drivers.createDriver')}</h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ApiErrorBanner
            error={apiError}
            jiraLabel={t('drivers.errors.createFailed', 'Error al crear conductor')}
            onReportClick={onClose}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label={t('drivers.form.fullNameLabel')}
                value={form.nombreCompleto}
                onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
                placeholder={t('drivers.form.fullNamePlaceholder')}
                error={errors.nombreCompleto}
                required
              />
            </div>

            <div className="md:col-span-1">
              <Input
                label={t('drivers.form.dniLabel')}
                value={form.dni || ''}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                placeholder={t('drivers.form.dniPlaceholder')}
              />
            </div>

            <div className="md:col-span-1">
              <Input
                label={t('drivers.form.emailLabel')}
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={t('drivers.form.emailPlaceholder')}
              />
            </div>

            <div className="md:col-span-2">
              <Input
                label={t('drivers.form.phoneLabel')}
                type="tel"
                value={form.telefono || ''}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder={t('drivers.form.phonePlaceholder')}
              />
            </div>
          </div>


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
