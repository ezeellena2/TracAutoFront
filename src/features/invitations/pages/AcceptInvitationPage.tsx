import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { invitacionesApi } from '@/services/endpoints';
import { InvitacionDto } from '@/shared/types/api';
import { Button, Input } from '@/shared/ui';
import { useErrorHandler } from '@/hooks';

type PageState = 'loading' | 'valid' | 'expired' | 'invalid' | 'already_accepted' | 'success' | 'error';

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
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
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }
    
    if (!token) return;
    
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await invitacionesApi.aceptarInvitacion(token, {
        nombreCompleto: formData.nombreCompleto,
        password: formData.password,
        telefono: formData.telefono || undefined,
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
          <p className="mt-4 text-text-muted">Validando invitación...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (pageState === 'expired' || pageState === 'invalid' || pageState === 'already_accepted') {
    const messages = {
      expired: {
        icon: <AlertTriangle className="w-16 h-16 text-amber-500" />,
        title: 'Invitación Expirada',
        text: 'Esta invitación ha expirado. Por favor, solicita una nueva invitación al administrador.',
      },
      invalid: {
        icon: <XCircle className="w-16 h-16 text-red-500" />,
        title: 'Invitación Inválida',
        text: 'El enlace de invitación no es válido o ya no existe.',
      },
      already_accepted: {
        icon: <CheckCircle className="w-16 h-16 text-blue-500" />,
        title: 'Invitación Ya Utilizada',
        text: 'Esta invitación ya fue aceptada anteriormente.',
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
            <Button variant="primary">Ir al Login</Button>
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
          <h1 className="text-2xl font-bold text-text mb-2">¡Bienvenido!</h1>
          <p className="text-text-muted mb-6">
            Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.
          </p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Iniciar Sesión
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
          <h1 className="text-2xl font-bold text-text">Únete a {invitation?.nombreOrganizacion}</h1>
          <p className="text-text-muted mt-2">
            Has sido invitado como <strong>{invitation?.rolAsignado}</strong>
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Email
              </label>
              <input
                type="email"
                value={invitation?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-muted"
              />
            </div>

            <Input
              label="Nombre completo"
              value={formData.nombreCompleto}
              onChange={(e) => setFormData(prev => ({ ...prev, nombreCompleto: e.target.value }))}
              placeholder="Juan Pérez"
              required
            />

            <Input
              label="Contraseña"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Repetir contraseña"
              required
            />

            <Input
              label="Teléfono (opcional)"
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              placeholder="+54 11 1234-5678"
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
                  Creando cuenta...
                </>
              ) : (
                'Crear mi cuenta'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
