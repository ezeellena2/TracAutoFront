import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, XCircle, Ban, CheckCircle, Car } from 'lucide-react';
import { Button } from './Button';

export type LinkErrorType = 'expired' | 'invalid' | 'cancelled' | 'already_accepted';

interface LinkErrorStateProps {
  /** Tipo de error para determinar icono y mensajes por defecto */
  type: LinkErrorType;
  /** Título personalizado (opcional) */
  title?: string;
  /** Mensaje personalizado (opcional) */
  message?: string;
  /** Texto del botón (opcional, default: "Ir al Login") */
  buttonText?: string;
  /** Ruta a la que redirigir (opcional, default: "/login") */
  to?: string;
  /** Callback para el botón (opcional, si se provee no se usa Link) */
  onButtonClick?: () => void;
  /** Si debe ocupar toda la pantalla (opcional, default: true) */
  fullScreen?: boolean;
}

/**
 * Componente compartido para estados de error de enlaces (invitaciones, reset password, etc.)
 * Muestra un icono central, título, mensaje y un botón de acción.
 */
export function LinkErrorState({
  type,
  title,
  message,
  buttonText,
  to = '/login',
  onButtonClick,
  fullScreen = true
}: LinkErrorStateProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const config: Record<LinkErrorType, { icon: ReactNode; defaultTitle: string; defaultText: string }> = {
    expired: {
      icon: <AlertTriangle className="w-16 h-16 text-amber-500" />,
      defaultTitle: t('invitations.expired.title'),
      defaultText: t('invitations.expired.text'),
    },
    invalid: {
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      defaultTitle: t('invitations.invalid.title'),
      defaultText: t('invitations.invalid.text'),
    },
    cancelled: {
      icon: <Ban className="w-16 h-16 text-red-400" />,
      defaultTitle: t('invitations.cancelled.title'),
      defaultText: t('invitations.cancelled.text'),
    },
    already_accepted: {
      icon: <CheckCircle className="w-16 h-16 text-blue-500" />,
      defaultTitle: t('invitations.alreadyAccepted.title'),
      defaultText: t('invitations.alreadyAccepted.text'),
    },
  };

  const { icon, defaultTitle, defaultText } = config[type];

  const handleAction = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      navigate(to);
    }
  };

  const content = (


    <div className="max-w-md w-full text-center p-4">
      <div className="flex items-center justify-center gap-5 mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary shadow-lg shadow-primary/20">
          <Car size={38} className="text-white" />
        </div>
        <div className="text-left">
          <h1 className="text-3xl font-bold text-text">{t('auth.title')}</h1>
          <p className="text-base text-text-muted mt-1">{t('auth.subtitle')}</p>
        </div>
      </div>

      <div className="mb-8 mt-12 flex justify-center">{icon}</div>
      <h1 className="text-xl font-bold text-text mb-2">{title || defaultTitle}</h1>
      <p className="text-text-muted mb-12 whitespace-pre-wrap">{message || defaultText}</p>

      <Button variant="primary" onClick={handleAction}>
        {buttonText || t('invitations.goToLogin')}
      </Button>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}
