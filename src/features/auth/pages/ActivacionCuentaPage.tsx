import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Alert, Button, Input } from '@/shared/ui';
import { authApi } from '@/services/endpoints';
import { AuthSessionSnapshotDto, PasswordSchema } from '@/shared/types/api';
import { hydrateAuthenticatedSession } from '@/services/auth/sessionHydration';

type ActivationState = {
  activationData?: {
    email: string;
    personaId?: string | null;
    nombre: string;
    tokenActivacion?: string | null;
  };
} | null;

type ActivationStatus = 'loading' | 'ready' | 'invalid' | 'expired' | 'already-activated' | 'success';

export function ActivacionCuentaPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = location.state as ActivationState;

  const token = searchParams.get('token') ?? state?.activationData?.tokenActivacion ?? null;
  const [status, setStatus] = useState<ActivationStatus>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [personaNombre, setPersonaNombre] = useState(state?.activationData?.nombre ?? '');
  const [personaEmail, setPersonaEmail] = useState(state?.activationData?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    let active = true;
    setStatus('loading');
    setError('');

    authApi.validarActivacionCuenta(token)
      .then((response) => {
        if (!active) return;

        setPersonaNombre(response.nombre || state?.activationData?.nombre || '');
        setPersonaEmail(response.email || state?.activationData?.email || '');

        if (response.cuentaYaActivada) {
          setStatus('already-activated');
          setSuccessMessage(response.mensaje);
          return;
        }

        if (response.expirada) {
          setStatus('expired');
          setError(response.mensaje);
          return;
        }

        setStatus('ready');
      })
      .catch((err) => {
        if (!active) return;
        setStatus('invalid');
        setError(err instanceof Error ? err.message : 'El enlace de activación es inválido.');
      });

    return () => {
      active = false;
    };
  }, [token, state?.activationData?.email, state?.activationData?.nombre]);

  const passwordError = useMemo(() => {
    if (!passwordTouched && password.length === 0) return '';
    const result = PasswordSchema.safeParse(password);
    return result.success ? '' : result.error.errors[0]?.message ?? '';
  }, [password, passwordTouched]);

  const confirmPasswordError = useMemo(() => {
    if (!confirmTouched && confirmPassword.length === 0) return '';
    if (!confirmPassword) return 'common.required';
    return password === confirmPassword ? '' : 'auth.errors.passwordMismatch';
  }, [confirmPassword, confirmTouched, password]);

  const resolveErrorMessage = (message: string) => {
    if (!message) return '';
    if (message.includes('.')) {
      const translated = t(message);
      return translated === message ? message : translated;
    }

    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordTouched(true);
    setConfirmTouched(true);
    setError('');

    if (!token) {
      setStatus('invalid');
      setError('El enlace de activación es inválido.');
      return;
    }

    if (passwordError || confirmPasswordError) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.activarCuenta({
        tokenInvitacion: token,
        password,
        confirmPassword,
      });

      if (response.requiereLogin || !response.token || !response.contextoActivo || !response.usuarioId) {
        navigate('/login', {
          replace: true,
          state: { message: response.mensaje || 'La cuenta ya fue activada. Iniciá sesión para continuar.' },
        });
        return;
      }

      const snapshot: AuthSessionSnapshotDto = {
        usuarioId: response.usuarioId,
        personaId: response.personaId ?? null,
        organizacionId: response.organizacionId ?? null,
        nombreUsuario: response.nombreUsuario ?? personaNombre,
        email: response.email ?? personaEmail,
        nombreOrganizacion: response.nombreOrganizacion ?? null,
        rol: response.rol ?? null,
        theme: response.theme ?? null,
        modulosActivos: response.modulosActivos ?? [],
        capacidadesEfectivas: response.capacidadesEfectivas ?? [],
        contextoActivo: response.contextoActivo,
        contextosDisponibles: response.contextosDisponibles ?? [],
      };

      hydrateAuthenticatedSession(snapshot, response.token, response.theme);
      setStatus('success');
      setSuccessMessage(response.mensaje || 'Cuenta activada correctamente.');
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo activar la cuenta.';
      setError(message);

      if (message.toLowerCase().includes('expir')) {
        setStatus('expired');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-surface rounded-2xl border border-border p-8 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Activá tu cuenta</h1>
            <p className="text-sm text-text-muted mt-1">
              Completá la activación para convertir esta persona en un usuario real de la plataforma.
            </p>
          </div>
        </div>

        {status === 'loading' && (
          <div className="py-10 text-center text-text-muted">
            <Loader2 className="mx-auto mb-3 animate-spin" />
            Validando enlace de activación...
          </div>
        )}

        {status !== 'loading' && (
          <>
            <div className="rounded-xl border border-border bg-background/60 p-5 mb-6 space-y-4">
              <div className="flex items-center gap-3">
                <UserRound size={18} className="text-text-muted" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">Persona</p>
                  <p className="text-sm font-medium text-text">{personaNombre || 'Cuenta pendiente de activación'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={18} className="text-text-muted" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">Email</p>
                  <p className="text-sm font-medium text-text">{personaEmail || 'No informado'}</p>
                </div>
              </div>
            </div>

            {error && <Alert type="error" message={error} className="mb-4" />}
            {successMessage && status !== 'success' && <Alert type="success" message={successMessage} className="mb-4" />}

            {status === 'ready' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-text block mb-2">Contraseña</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="Ingresá una contraseña"
                  />
                  {passwordError && <p className="mt-1 text-sm text-error">{resolveErrorMessage(passwordError)}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-text block mb-2">Confirmar contraseña</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setConfirmTouched(true)}
                    placeholder="Repetí la contraseña"
                  />
                  {confirmPasswordError && <p className="mt-1 text-sm text-error">{resolveErrorMessage(confirmPasswordError)}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <KeyRound size={16} className="mr-2" />}
                  Activar cuenta
                </Button>
              </form>
            )}

            {status === 'already-activated' && (
              <div className="space-y-4">
                <Alert type="success" message="La cuenta ya fue activada. Podés iniciar sesión con tus credenciales actuales." />
                <Button className="w-full" onClick={() => navigate('/login', { state: { message: successMessage } })}>
                  Ir al login
                </Button>
              </div>
            )}

            {status === 'expired' && (
              <div className="space-y-4">
                <Alert type="warning" message="El enlace de activación expiró. Volvé a iniciar el flujo para generar uno nuevo." />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" onClick={() => navigate('/login')} className="w-full sm:w-auto">
                    <ArrowLeft size={16} className="mr-2" />
                    Volver al login
                  </Button>
                  <Link
                    to="/registro"
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary-dark"
                  >
                    Ir al registro web
                  </Link>
                </div>
              </div>
            )}

            {status === 'invalid' && (
              <div className="space-y-4">
                <Alert type="error" message="El enlace de activación no es válido." />
                <Button variant="outline" onClick={() => navigate('/login')} className="w-full sm:w-auto">
                  <ArrowLeft size={16} className="mr-2" />
                  Volver al login
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ActivacionCuentaPage;
