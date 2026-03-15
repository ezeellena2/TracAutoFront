import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Mail } from 'lucide-react';
import { Modal, Input, Button, Select, Alert } from '@/shared/ui';
import { invitacionesApi } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type RolOption = 'Admin' | 'Operador' | 'Analista';

const InviteUserSchema = z.object({
  email: z.string().min(1, "common.required").email("auth.errors.invalidEmail"),
  rol: z.enum(['Admin', 'Operador', 'Analista'], {
    required_error: "common.required",
  }),
});

type InviteUserFormData = z.infer<typeof InviteUserSchema>;

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    clearErrors,
    formState: { errors: formErrors, isSubmitting },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(InviteUserSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      rol: 'Analista',
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        email: '',
        rol: 'Analista',
      });
      setGeneralError(null);
      setRetryCount(0);
      clearErrors();
    }
  }, [isOpen, reset, clearErrors]);

  const roleOptions = [
    { value: 'Analista', label: t('users.roles.analista') },
    { value: 'Operador', label: t('users.roles.operador') },
    { value: 'Admin', label: t('users.roles.admin') },
  ];

  const onFormSubmit = async (data: InviteUserFormData) => {
    setGeneralError(null);

    try {
      await invitacionesApi.createInvitacion(data.email, data.rol as RolOption);
      reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const parsed = handleApiError(err, { showToast: false, showReportModal: false });
      
      if (parsed.status === 500) {
        const newCount = retryCount + 1;
        setRetryCount(newCount);
        
        if (newCount >= 3) {
          setGeneralError(t('errors.HTTP_500'));
        } else {
          setGeneralError(parsed.message);
        }
      } else {
        setGeneralError(parsed.message);
      }
    }
  };

  const isServerError = !!generalError && retryCount > 0; // If retryCount > 0 it means it was a 500

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail size={18} className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-text">{t('users.inviteUser')}</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>


        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>
          <div>
            <Input
              label={
                <span>
                  {t('users.form.emailLabel')} <span className="text-error">*</span>
                </span>
              }
              type="email"
              {...register('email')}
              onFocus={() => clearErrors('email')}
              placeholder={t('users.form.emailPlaceholder')}
              error={formErrors.email?.message ? t(formErrors.email.message as any) : ''}
              autoComplete="off"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Select
              label={
                <span>
                  {t('users.form.roleLabel')} <span className="text-error">*</span>
                </span>
              }
              value={watch('rol')}
              onChange={(val) => setValue('rol', val as any, { shouldValidate: true })}
              onFocus={() => clearErrors('rol')}
              options={roleOptions}
              disabled={isSubmitting}
            />
          </div>

          {generalError && (
            <Alert 
              type="error"
              message={generalError}
              onRetry={isServerError && retryCount < 3 ? () => handleSubmit(onFormSubmit)() : undefined}
            />
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? t('users.sending') : t('users.sendInvitation')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
