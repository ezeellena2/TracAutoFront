import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Ban } from 'lucide-react';
import { invitacionesApi } from '@/services/endpoints';
import { InvitacionDto } from '@/shared/types/api';
import { Button, Input } from '@/shared/ui';
import { useErrorHandler } from '@/hooks';

type PageState = 'loading' | 'valid' | 'expired' | 'invalid' | 'cancelled' | 'already_accepted' | 'success' | 'error';

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { parseError, getErrorMessage } = useErrorHandler();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<InvitacionDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [formData, setFormData] = useState({
    nombreCompleto: '',
    password: '',
    confirmPassword: '',
    telefono: '',
  });

  useEffect(() => {
    if (!token) {
      setPageState('invalid');
      return;
    }

    const validateToken = async () => {
      try {
        const data = await invitacionesApi.validarInvitacion(token);
        setInvitation(data);
        setPageState('valid');
      } catch (err: unknown) {
        const parsed = parseError(err);
        const code = parsed.code;

        if (code === 'errors.Invitacion.Expirada' || code === 'Invitacion.Expirada') {
          setPageState('expired');
        } else if (code === 'errors.Invitacion.YaAceptada' || code === 'Invitacion.YaAceptada') {
          setPageState('already_accepted');
        } else if (code === 'errors.Invitacion.Cancelada' || code === 'Invitacion.Cancelada') {
          setPageState('cancelled');
        } else {
          setPageState('invalid');
        }
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(t('invitations.passwordsDoNotMatch', 'Las contraseñas no coinciden'));
      return;
    }

    if (!token) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await invitacionesApi.aceptarInvitacion(token, {
        nombreCompleto: formData.nombreCompleto,
        password: formData.password,
        telefono: formData.telefono,
      });
      setPageState('success');
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err));
      setPageState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-text-muted">{t('invitations.validating', 'Validando invitación...')}</p>
        </div>
      </div>
    );
  }

  // Error states
  if (pageState === 'expired' || pageState === 'invalid' || pageState === 'already_accepted' || pageState === 'cancelled') {
    const messages = {
      expired: {
        icon: <AlertTriangle className="w-16 h-16 text-amber-500" />,
        title: t('invitations.expired.title', 'Invitación Expirada'),
        text: t('invitations.expired.text', 'Esta invitación ha expirado. Por favor, solicita una nueva invitación al administrador.'),
      },
      invalid: {
        icon: <XCircle className="w-16 h-16 text-red-500" />,
        title: t('invitations.invalid.title', 'Invitación Inválida'),
        text: t('invitations.invalid.text', 'El enlace de invitación no es válido o ya no existe.'),
      },
      cancelled: {
        icon: <Ban className="w-16 h-16 text-red-400" />,
        title: t('invitations.cancelled.title', 'Invitación Cancelada'),
        text: t('invitations.cancelled.text', 'Esta invitación fue cancelada por el administrador. Solicitá una nueva invitación.'),
      },
      already_accepted: {
        icon: <CheckCircle className="w-16 h-16 text-blue-500" />,
        title: t('invitations.alreadyAccepted.title', 'Invitación Ya Utilizada'),
        text: t('invitations.alreadyAccepted.text', 'Esta invitación ya fue aceptada anteriormente.'),
      },
    };

    const { icon, title, text } = messages[pageState];

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">{icon}</div>
          <h1 className="text-2xl font-bold text-text mb-2">{title}</h1>
          <p className="text-text-muted mb-6">{text}</p>
          <Link to="/login">
            <Button variant="primary">{t('invitations.goToLogin', 'Ir al Login')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-text mb-2">{t('invitations.success.title', '¡Bienvenido!')}</h1>
          <p className="text-text-muted mb-6">
            {t('invitations.success.text', 'Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.')}
          </p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            {t('invitations.login', 'Iniciar Sesión')}
          </Button>
        </div>
      </div>
    );
  }

  // Valid invitation - show form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text">
            {t('invitations.joinOrg', 'Únete a {{org}}', { org: invitation?.nombreOrganizacion })}
          </h1>
          <p className="text-text-muted mt-2">
            {t('invitations.invitedAs', 'Has sido invitado como')} <strong>{invitation?.rolAsignado}</strong>
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                {t('invitations.form.email', 'Email')}
              </label>
              <input
                type="email"
                value={invitation?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-muted"
              />
            </div>

            <Input
              label={t('invitations.form.fullName', 'Nombre completo')}
              value={formData.nombreCompleto}
              onChange={(e) => setFormData(prev => ({ ...prev, nombreCompleto: e.target.value }))}
              placeholder={t('invitations.form.fullNamePlaceholder', 'Juan Pérez')}
              required
            />

            <Input
              label={t('invitations.form.password', 'Contraseña')}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={t('invitations.form.passwordPlaceholder', 'Mínimo 8 caracteres')}
              required
              minLength={8}
            />

            <Input
              label={t('invitations.form.confirmPassword', 'Confirmar contraseña')}
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder={t('invitations.form.confirmPasswordPlaceholder', 'Repetir contraseña')}
              required
            />

            <Input
              label={t('invitations.form.phone', 'Teléfono')}
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              placeholder={t('invitations.form.phonePlaceholder', '+54 11 1234-5678')}
              required
            />

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('invitations.form.creating', 'Creando cuenta...')}
                </>
              ) : (
                t('invitations.form.submit', 'Crear mi cuenta')
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          {t('invitations.alreadyHaveAccount', '¿Ya tienes cuenta?')}{' '}
          <Link to="/login" className="text-primary hover:underline">
            {t('invitations.login', 'Iniciar sesión')}
          </Link>
        </p>
      </div>
    </div>
  );
}
