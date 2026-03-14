import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<RolOption>('Analista');
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const roleOptions = [
    { value: 'Analista', label: t('users.roles.analista') },
    { value: 'Operador', label: t('users.roles.operador') },
    { value: 'Admin', label: t('users.roles.admin') },
  ];


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralError(null);

    try {
      await invitacionesApi.createInvitacion(email, rol);
      setEmail('');
      setRol('Analista');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const parsed = handleApiError(err, { showToast: false, showReportModal: false });
      setGeneralError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  };

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

        {generalError && (
          <Alert type="error" message={generalError} className="mb-6" />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>

            <Input
              label={
                <span>
                  {t('users.form.emailLabel')} <span className="text-error">*</span>
                </span>
              }
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('users.form.emailPlaceholder')}
              required
              autoComplete="off"
            />
          </div>

          <div>
            <Select
              label=<span>
                {t('users.form.roleLabel')} <span className="text-error">*</span>
              </span>
              value={rol}
              onChange={(val) => setRol(val as RolOption)}
              options={roleOptions}
              required
            />
          </div>



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
              isLoading={isLoading}
              disabled={isLoading || !email}
              className="flex-1"
            >
              {isLoading ? t('users.sending') : t('users.sendInvitation')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
