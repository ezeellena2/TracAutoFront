import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, Input, Button } from '@/shared/ui';
import { invitacionesApi } from '@/services/endpoints';
import { toast } from '@/store';
import { useErrorHandler } from '@/hooks';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type RolOption = 'Admin' | 'Operador' | 'Analista';

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const { t } = useTranslation();
  const { getErrorMessage } = useErrorHandler();
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<RolOption>('Analista');
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await invitacionesApi.createInvitacion(email, rol);
      toast.success(t('users.success.invitationSent', { email }));
      setEmail('');
      setRol('Analista');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">{t('users.inviteUser')}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              {t('users.form.emailLabel')}
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('users.form.emailPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">
              {t('users.form.roleLabel')}
            </label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as RolOption)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="Analista">{t('users.roles.analista')}</option>
              <option value="Operador">{t('users.roles.operador')}</option>
              <option value="Admin">{t('users.roles.admin')}</option>
            </select>
            <p className="text-xs text-text-muted mt-1">
              {rol === 'Admin' && t('users.form.roleAdminHint')}
              {rol === 'Operador' && t('users.form.roleOperadorHint')}
              {rol === 'Analista' && t('users.form.roleAnalistaHint')}
            </p>
          </div>



          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
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
