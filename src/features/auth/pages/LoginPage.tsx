import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Car, Eye, EyeOff, HelpCircle, Loader2, Building2, Mail, X } from 'lucide-react';
import { Button, Input, Alert, Modal } from '@/shared/ui';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
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
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isCuentaBloqueada, setIsCuentaBloqueada] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);


  // Reset Password Finalization State
  const [showFinalResetModal, setShowFinalResetModal] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetTargetEmail, setResetTargetEmail] = useState('');




  // Mostrar mensaje de éxito si viene de verificación
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      setSuccessMessage(state.message);
      // Limpiar el state para que no se muestre de nuevo
      window.history.replaceState({}, document.title);
    }

    // Detectar token de reseteo en la URL
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (token) {
        setResetToken(token);
        if (emailParam) setResetTargetEmail(emailParam);
        setShowFinalResetModal(true);

        // Limpiar URL para evitar que aparezca el modal de nuevo al refrescar
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
  }, [location.search]);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && token) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, token, navigate, location]);

  // Detectar autofill del navegador — Chrome no dispara onChange
  useEffect(() => {
    const checkAutofill = () => {
      try {
        const emailFilled = emailRef.current?.matches(':-webkit-autofill') || emailRef.current?.matches(':autofill') || false;
        const passwordFilled = passwordRef.current?.matches(':-webkit-autofill') || passwordRef.current?.matches(':autofill') || false;
        if (emailFilled && passwordFilled) {
          setIsAutofilled(true);
        }
      } catch (e) {
        // :autofill/:webkit-autofill puede no ser soportado en todos los browsers
        console.debug('Autofill detection not supported:', e);
      }
    };
    // Polling breve: Chrome aplica autofill con un ligero delay
    const timers = [
      setTimeout(checkAutofill, 100),
      setTimeout(checkAutofill, 500),
      setTimeout(checkAutofill, 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  /** Detecta si el error indica cuenta no verificada (código o texto) */
  const detectCuentaNoVerificada = (errorCode: string, errorMessage: string): boolean =>
    errorCode === 'Auth.EmailNoVerificado' ||
    errorCode === 'Auth.CuentaNoVerificada' ||
    errorCode.includes('EmailNoVerificado') ||
    errorCode.includes('CuentaNoVerificada') ||
    errorMessage.includes('emailnoverificado') ||
    errorMessage.includes('cuentanoverificada') ||
    errorMessage.includes('completamente verificada') ||
    errorMessage === t('auth.errors.accountNotVerified').toLowerCase();

  /** Detecta si el error indica cuenta bloqueada */
  const detectCuentaBloqueada = (errorCode: string, errorMessage: string): boolean =>
    errorCode === 'Auth.CuentaBloqueadaTemporal' ||
    errorCode === 'Auth.CuentaBloqueadaPermanente' ||
    errorCode === 'Auth.CuentaBloqueada' ||
    errorMessage.includes('bloqueada') ||
    errorMessage.includes('cuentabloqueada');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Autofill fallback: Chrome no dispara onChange, leer del DOM directamente
    let loginEmail = email;
    let loginPassword = password;
    if (isAutofilled && (!email || !password)) {
      loginEmail = emailRef.current?.value || email;
      loginPassword = passwordRef.current?.value || password;
      if (loginEmail) setEmail(loginEmail);
      if (loginPassword) setPassword(loginPassword);
    }

    // Validate inline errors explicitly before submission
    const newEmailError = validateEmail(loginEmail);
    const newPasswordError = validatePassword(loginPassword);

    setEmailTouched(true);
    setPasswordTouched(true);

    if (newEmailError || newPasswordError) {
      setEmailError(newEmailError);
      setPasswordError(newPasswordError);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    const result = await authService.login(loginEmail, loginPassword, rememberMe);

    if (result.success) {
      // Redirigir al dashboard
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else {
      // Detectar tipo de error por código estructurado (preferido) o por texto (fallback)
      const errorCode = result.errorCode || '';
      const errorMessage = result.error?.toLowerCase() || '';

      const isCuentaNoVerificada = detectCuentaNoVerificada(errorCode, errorMessage);

      if (isCuentaNoVerificada) {
        const targetEmail = result.email || loginEmail;
        const eStatus = result.extensions?.emailVerificado as boolean | undefined;
        const tStatus = result.extensions?.telefonoVerificado as boolean | undefined;
        const uId = (result.extensions?.usuarioId as string) || '';

        await executeResendAndRedirect(targetEmail, eStatus, tStatus, uId, false);
        setIsLoading(false);
        return;
      } else if (detectCuentaBloqueada(errorCode, errorMessage)) {
        setIsCuentaBloqueada(true);
        setError(t('auth.errors.accountBlocked'));
      } else {
        const status = result.status;

        // Enmascarar errores 400 como credenciales inválidas para no dar pistas 
        // y errores >=500 como problemas de red / servidor.
        if (status && status >= 400 && status < 500) {
          setError(t('errors.Auth.CredencialesInvalidas'));
        } else if (status && status >= 500) {
          setError(t('errors.network'));
        } else {
          setError(result.error || t('auth.errors.authError'));
        }
      }
    }

    setIsLoading(false);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError(t('auth.errors.invalidEmail'));
      return;
    }

    setIsResetLoading(true);
    setResetError('');

    const result = await authService.solicitarResetPassword(resetEmail);

    if (result.success) {
      setResetSuccess(true);
      // Cerrar modal automáticamente después de unos segundos
      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess(false);
        setResetEmail('');
      }, 5000);
    } else {
      setResetError(result.error || t('auth.errors.resetPasswordError'));
    }
    setIsResetLoading(false);
  };

  const validateEmail = (value: string) => {
    if (!value) return 'common.required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'auth.errors.invalidEmail';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return 'common.required';
    return '';
  };

  // Google OAuth: recibe el credential (ID Token JWT) del componente GoogleLogin
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError(t('auth.errors.authError'));
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    const result = await authService.loginWithGoogle(credentialResponse.credential);

    if (result.success) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else if (result.requiereRegistro && result.googleData) {
      navigate('/registro', {
        state: { googleData: result.googleData },
      });
    } else {
      const errorCode = result.errorCode || '';
      const errorMessage = (result.error || '').toLowerCase();

      const isCuentaNoVerificada = detectCuentaNoVerificada(errorCode, errorMessage);

      if (isCuentaNoVerificada) {
        const targetEmail = result.email || email;
        const eStatus = result.extensions?.emailVerificado as boolean | undefined;
        const tStatus = result.extensions?.telefonoVerificado as boolean | undefined;
        const uId = (result.extensions?.usuarioId as string) || '';

        await executeResendAndRedirect(targetEmail, eStatus, tStatus, uId, true);
        setIsLoading(false);
        return;
      } else if (detectCuentaBloqueada(errorCode, errorMessage)) {
        setIsCuentaBloqueada(true);
        setError(t('auth.errors.accountBlocked'));
      } else {
        setError(result.error || t('auth.errors.authError'));
      }
    }

    setIsLoading(false);
  };

  /**
   * Helper unificado para disparar el reenvío y mover al usuario a la pantalla de verificación.
   */
  const executeResendAndRedirect = async (
    targetEmail: string,
    emailVerif: boolean | undefined,
    telVerif: boolean | undefined,
    uId: string,
    isGoogle: boolean = false
  ) => {
    setError('');
    setSuccessMessage('');

    try {
      // Determinar canales. Si es Google, el email se asume verificado (o el backend lo marca).
      let canalesAReenviar = CanalEnvio.Ambos;
      if (emailVerif === false && telVerif === false) {
        canalesAReenviar = CanalEnvio.Ambos;
      } else if (emailVerif === false) {
        canalesAReenviar = CanalEnvio.Email;
      } else if (telVerif === false) {
        canalesAReenviar = CanalEnvio.SMS;
      }

      // Ajuste para Google: si falta el tel, mandamos solo SMS (email ya está validado por Google)
      if (isGoogle && telVerif === false) {
        canalesAReenviar = CanalEnvio.SMS;
      }

      // Reenvío de código antes de redirigir
      await authApi.reenviarCodigo({
        email: targetEmail,
        canal: canalesAReenviar,
      });

      // Redirección inmediata
      navigate('/registro', {
        state: {
          modoVerificacion: true,
          email: targetEmail,
          emailVerificado: emailVerif ?? (isGoogle ? true : false),
          telefonoVerificado: telVerif,
          isGoogle: isGoogle,
          usuarioId: uId,
          organizacionId: '',
          nombreOrganizacion: '',
        },
      });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : t('auth.errors.resendCodeError');
      setError(message);
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" onClick={() => { if (error) setError(''); if (successMessage) setSuccessMessage(''); }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-5 mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Car size={38} className="text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-text">{t('auth.title')}</h1>
            <p className="text-base text-text-muted mt-1">{t('auth.subtitle')}</p>
          </div>
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

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <Input
              ref={emailRef}
              label={t('auth.emailLabel')}
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                setEmail(val);
                if (emailError) setEmailError('');
                setError('');
              }}
              onFocus={() => {
                setError('');
                setEmailError('');
                setIsCuentaBloqueada(false);
              }}
              onBlur={() => {
                setEmailTouched(true);
                setEmailError(validateEmail(email));
              }}
              error={emailTouched && emailError ? t(emailError) : ''}
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
              disabled={isLoading}
            />

            <div className="relative">
              <Input
                ref={passwordRef}
                label={t('auth.passwordLabel')}
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  if (passwordError) setPasswordError('');
                  setError('');
                  setIsCuentaBloqueada(false);
                }}
                onBlur={() => {
                  setPasswordTouched(true);
                  setPasswordError(validatePassword(password));
                }}
                error={passwordTouched && passwordError ? t(passwordError) : ''}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="new-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-text-muted hover:text-text"
                disabled={isLoading}
                aria-label={showPassword ? t('auth.hidePassword', 'Ocultar contraseña') : t('auth.showPassword', 'Mostrar contraseña')}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between mb-6">
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

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setResetEmail(email); // Sugerir el email ya escrito si existe
                  setShowResetModal(true);
                }}
                className="text-sm text-primary hover:underline font-medium"
                disabled={isLoading}
              >
                {t('auth.forgotPassword')}
              </button>
            </div>

            {error && (
              <div className="flex flex-col gap-2 mt-4">
                <Alert
                  type="error"
                  message={error}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full !mt-8"
              size="lg"
              disabled={isLoading || isCuentaBloqueada}
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
            <div
              className={`relative w-full transition-opacity ${isCuentaBloqueada ? 'opacity-50 pointer-events-none' : ''}`}
              style={{ height: '48px' }}
            >
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

          <div className="mt-8 space-y-4">
            <p className="text-center text-sm text-text-muted mb-2">
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
            <button className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors" aria-label={t('auth.contactSupport')}>
              <HelpCircle size={16} />
              {t('auth.contactSupport')}
            </button>
          </div>
        </div>

        {/* Legal message */}
        <p className="mt-6 text-center text-xs text-text-muted">
          {t('auth.legalMessage')}
        </p>

        {/* Modal de Reset Password */}
        <Modal
          isOpen={showResetModal}
          onClose={() => {
            if (!isResetLoading) {
              setShowResetModal(false);
              setResetError('');
              setResetSuccess(false);
            }
          }}
        >
          <div className="relative">
            {/* Custom Header (matches verification style) */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-text text-lg leading-tight">
                    {t('auth.requestResetTitle')}
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    {t('auth.requestResetSubtitle')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isResetLoading) {
                    setShowResetModal(false);
                    setResetError('');
                    setResetSuccess(false);
                  }
                }}
                className="p-1 -mr-1 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {!resetSuccess ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <Input
                  label={t('auth.emailLabel')}
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="off"
                  autoFocus
                  error={resetError}
                />
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowResetModal(false)}
                    disabled={isResetLoading}
                  >
                    {t('common.cancel', 'Cancelar')}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    isLoading={isResetLoading}
                  >
                    {t('auth.requestResetButton')}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="py-2 space-y-4">
                <Alert
                  type="success"
                  message={t('auth.success.resetPasswordEmailSent')}
                />
                <Button
                  className="w-full"
                  onClick={() => setShowResetModal(false)}
                >
                  {t('common.close', 'Cerrar')}
                </Button>
              </div>
            )}
          </div>
        </Modal>

        {/* Modal de Finalización de Reset Password (cuando viene token en URL) */}
        <ResetPasswordModal
          isOpen={showFinalResetModal}
          onClose={() => setShowFinalResetModal(false)}
          email={resetTargetEmail}
          token={resetToken}
        />
      </div>
    </div>
  );
}
