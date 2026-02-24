import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Car, Eye, EyeOff, HelpCircle, Loader2, Building2, Mail } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { useAuthStore } from '@/store';
import { authService } from '@/services/auth.service';
import { authApi } from '@/services/endpoints';
import { CanalEnvio } from '@/shared/types/api';

/**
 * Página de Login B2B Empresarial
 * Soporta:
 * - Login con email/password para usuarios verificados
 * - Registro de nueva empresa
 * - Login con Google
 */
export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailNoVerificado, setEmailNoVerificado] = useState(false);
  const [isReenviandoCodigo, setIsReenviandoCodigo] = useState(false);

  // Mostrar mensaje de éxito si viene de verificación
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      setSuccessMessage(state.message);
      // Limpiar el state para que no se muestre de nuevo
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && token) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, token, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError(t('auth.errors.completeFields'));
      return;
    }

    setIsLoading(true);
    setError('');
    setEmailNoVerificado(false);
    setSuccessMessage('');

    const result = await authService.login(email, password, rememberMe);

    if (result.success) {
      // Redirigir al dashboard
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else {
      // Detectar tipo de error por código estructurado (preferido) o por texto (fallback)
      const errorCode = result.errorCode || '';
      const errorMessage = result.error?.toLowerCase() || '';

      // Auth.EmailNoVerificado: detectar por código (robusto) o por texto como fallback
      const isEmailNoVerificado =
        errorCode === 'Auth.EmailNoVerificado' ||
        errorCode.includes('EmailNoVerificado') ||
        errorMessage.includes('emailnoverificado');

      if (isEmailNoVerificado) {
        setEmailNoVerificado(true);
        setError(t('auth.errors.accountNotVerified'));
      } else if (
        errorCode === 'Auth.CuentaBloqueada' ||
        errorMessage.includes('bloqueada') ||
        errorMessage.includes('cuentabloqueada')
      ) {
        setEmailNoVerificado(false);
        setError(t('auth.errors.accountBlocked'));
      } else {
        setEmailNoVerificado(false);
        setError(result.error || t('auth.errors.authError'));
      }
    }

    setIsLoading(false);
  };

  // Google OAuth: recibe el credential (ID Token JWT) del componente GoogleLogin
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError(t('auth.errors.authError'));
      return;
    }

    setError('');

    const result = await authService.loginWithGoogle(credentialResponse.credential);

    if (result.success) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else if (result.requiereRegistro && result.googleData) {
      navigate('/registro', {
        state: { googleData: result.googleData },
      });
    } else {
      setError(result.error || t('auth.errors.authError'));
    }
  };

  const handleReenviarCodigo = async () => {
    if (!email) {
      setError(t('auth.errors.completeFields'));
      return;
    }

    setIsReenviandoCodigo(true);
    setError('');
    setSuccessMessage('');

    try {
      const resultado = await authApi.reenviarCodigo({
        email,
        canal: CanalEnvio.Email,
      });

      // Navegar a la página de verificación con los datos necesarios
      navigate('/registro', {
        state: {
          modoVerificacion: true,
          email,
          usuarioId: resultado.usuarioId,
          organizacionId: resultado.organizacionId,
          nombreOrganizacion: resultado.nombreOrganizacion,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.errors.resendCodeError');
      setError(message);
      setIsReenviandoCodigo(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Car size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">{t('auth.title')}</h1>
          <p className="text-text-muted mt-1">{t('auth.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface rounded-2xl border border-border p-8">
          <h2 className="text-lg font-semibold text-text mb-2">
            {t('auth.signIn')}
          </h2>
          <p className="text-sm text-text-muted mb-6">
            {t('auth.signInSubtitle')}
          </p>

          {/* Mensaje de éxito */}
          {successMessage && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm mb-6">
              ✓ {successMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label={t('auth.emailLabel')}
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="username"
              required
              disabled={isLoading}
            />

            <div className="relative">
              <Input
                label={t('auth.passwordLabel')}
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-text-muted hover:text-text"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Remember Me Checkbox */}
            <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                disabled={isLoading}
              />
              {t('auth.rememberMe')}
            </label>

            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                <div>{error}</div>
                {emailNoVerificado && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleReenviarCodigo}
                      disabled={isReenviandoCodigo || isLoading}
                      className="w-full"
                    >
                      {isReenviandoCodigo ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          {t('auth.resendingCode')}
                        </>
                      ) : (
                        <>
                          <Mail size={16} className="mr-2" />
                          {t('auth.resendVerificationCode')}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  {t('auth.signingIn')}
                </>
              ) : (
                t('auth.signInButton')
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="w-full border-t border-border" />
            </div>

            {/* Google Login - styled to match "Ingresar" button */}
            <div className="relative w-full" style={{ height: '48px' }}>
              {/* Visual button underneath (what the user sees) */}
              <Button
                type="button"
                variant="outline"
                className="w-full pointer-events-none"
                size="lg"
                disabled={isLoading}
              >
                <svg className="mr-2" width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t('auth.continueWithGoogle', 'Continuar con Google')}
              </Button>
              {/* Real Google Login iframe on top (transparent, clickable) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ opacity: 0, cursor: 'pointer' }}
              >
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError(t('auth.errors.googleNotAvailable'))}
                  text="continue_with"
                  shape="rectangular"
                  size="large"
                  width="400"
                />
              </div>
            </div>
          </form>

          {/* Register link */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-muted mb-3">
              {t('auth.noAccount')}
            </p>
            <Link to="/registro">
              <Button variant="outline" className="w-full">
                <Building2 size={18} className="mr-2" />
                {t('auth.registerCompany')}
              </Button>
            </Link>
          </div>

          {/* Support link */}
          <div className="mt-4 text-center">
            <button className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors">
              <HelpCircle size={16} />
              {t('auth.contactSupport')}
            </button>
          </div>
        </div>

        {/* Legal message */}
        <p className="mt-6 text-center text-xs text-text-muted">
          {t('auth.legalMessage')}
        </p>
      </div>
    </div>
  );
}
