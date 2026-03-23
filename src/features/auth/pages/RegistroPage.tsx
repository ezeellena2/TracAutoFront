import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Car, Eye, EyeOff, Loader2, ArrowLeft, Building2, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { Button, Input, Select, Alert } from '@/shared/ui';
import { authApi } from '@/services/endpoints';
import { RegistrarEmpresaRequestSchema } from '@/shared/types/api';
import { hydrateAuthenticatedSession } from '@/services/auth/sessionHydration';

/**
 * Pagina de Registro de Empresa B2B
 * Flujo: Datos -> Registro -> Verificacion -> Auto-login -> Dashboard
 */
export function RegistroPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar si viene en modo verificacion o con datos de Google desde LoginPage
  const state = location.state as {
    modoVerificacion?: boolean;
    email?: string;
    usuarioId?: string;
    organizacionId?: string;
    nombreOrganizacion?: string;
    emailVerificado?: boolean;
    telefonoVerificado?: boolean;
    isGoogle?: boolean;
    googleData?: {
      email: string;
      nombre: string;
      fotoUrl: string | null;
      idToken: string;
    };
  } | null;

  // Flag: si viene de Google login, pre-llenamos email y nombre
  const [isGoogleRegistro, setIsGoogleRegistro] = useState(false);

  const [step, setStep] = useState<'datos' | 'verificacion'>(
    state?.modoVerificacion ? 'verificacion' : 'datos'
  );
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [isResending, setIsResending] = useState<'email' | 'sms' | null>(null);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const [successData, setSuccessData] = useState<{
    usuarioId: string;
    organizacionId: string;
    nombreOrganizacion: string;
  } | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    cuit: '',
    tipoCuenta: 0,
    nombreCompleto: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    aceptaTerminos: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);

  // Verification
  const [codigoEmail, setCodigoEmail] = useState('');
  const [codigoTelefono, setCodigoTelefono] = useState('');
  const [emailVerificado, setEmailVerificado] = useState<boolean>(false);
  const [telefonoVerificado, setTelefonoVerificado] = useState<boolean>(false);
  const [codigoEmailError, setCodigoEmailError] = useState('');
  const [codigoTelefonoError, setCodigoTelefonoError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [telefonoSuccess, setTelefonoSuccess] = useState('');

  // Inicializar datos si viene en modo verificacion o con datos de Google
  useEffect(() => {
    if (state?.modoVerificacion && state.email && state.usuarioId) {
      setFormData(prev => ({
        ...prev,
        email: state.email || '',
      }));
      setSuccessData({
        usuarioId: state.usuarioId,
        organizacionId: state.organizacionId || '',
        nombreOrganizacion: state.nombreOrganizacion || '',
      });

      setEmailVerificado(!!state.emailVerificado);
      setTelefonoVerificado(!!state.telefonoVerificado);

      if (state.emailVerificado) {
        setEmailSuccess(t(state.isGoogle ? 'auth.success.emailVerifiedGoogle' : 'auth.success.emailVerified'));
      }

      setStep('verificacion');
      window.history.replaceState({}, document.title);
    } else if (state?.googleData) {
      // Pre-llenar datos de Google
      setFormData(prev => ({
        ...prev,
        email: state.googleData!.email,
        nombreCompleto: state.googleData!.nombre,
      }));
      setIsGoogleRegistro(true);
      window.history.replaceState({}, document.title);
    }
  }, [state]);

  // Ref para que handleBlur siempre lea el valor mas reciente
  // (necesario porque commitE164 del PhoneInput llama updateField y luego onBlur en el mismo tick)
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const googleTokenRef = useRef<string | undefined>(state?.googleData?.idToken);

  // Detectar autofill del navegador al montar
  useEffect(() => {
    const checkAutofill = () => {
      const emailValue = emailInputRef.current?.value;
      const passwordValue = passwordInputRef.current?.value;

      if (emailValue && emailValue !== formDataRef.current.email) {
        updateField('email', emailValue);
      }
      if (passwordValue && passwordValue !== formDataRef.current.password) {
        updateField('password', passwordValue);
      }
    };

    // Polling breve: algunos navegadores aplican autofill con un ligero delay
    const timers = [
      setTimeout(checkAutofill, 100),
      setTimeout(checkAutofill, 500),
      setTimeout(checkAutofill, 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const updateField = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      formDataRef.current = next;
      return next;
    });
    setError('');
  };

  const handleFocus = (_field: string) => {
    // No longer needed for fieldErrors but kept for consistency if needed later
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Formatear CUIT: XX-XXXXXXXX-X
  const formatCuit = (value: string) => {
    // Solo numeros, max 11 digitos
    const digits = value.replace(/\D/g, '').slice(0, 11);
    let res = digits;

    if (digits.length > 2) {
      res = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    if (digits.length > 10) {
      res = `${res.slice(0, 11)}-${res.slice(11)}`;
    }
    return res;
  };

  // Validacion de CUIT argentino (algoritmo modulo 11)
  const validarCuit = (cuit: string): boolean => {
    // Normalizar: remover guiones y espacios
    const cuitNormalizado = cuit.replace(/[^\d]/g, '');

    if (cuitNormalizado.length !== 11) return false;

    // Validar tipos validos (primeros 2 digitos)
    const tipo = parseInt(cuitNormalizado.substring(0, 2), 10);
    const tiposValidos = [20, 23, 24, 27, 30, 33, 34];
    if (!tiposValidos.includes(tipo)) return false;

    // Calcular digito verificador (modulo 11)
    const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 10; i++) {
      suma += parseInt(cuitNormalizado[i], 10) * multiplicadores[i];
    }
    const resto = 11 - (suma % 11);
    const digitoCalculado = resto === 11 ? 0 : (resto === 10 ? 9 : resto);
    const digitoReal = parseInt(cuitNormalizado[10], 10);

    return digitoCalculado === digitoReal;
  };

  // Tipos de cuenta disponibles
  const tiposOrganizacion = [
    { value: 1, label: t('auth.orgTypes.empresa') },
    { value: 2, label: t('auth.orgTypes.personaFisica') },
  ];

  // Errores derivados del estado del formulario
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    const {
      nombreEmpresa, cuit, tipoCuenta, nombreCompleto,
      email, telefono, password, confirmPassword, aceptaTerminos
    } = formData;

    if (!nombreEmpresa.trim()) errs.nombreEmpresa = t('auth.errors.fieldRequired');

    if (!cuit.trim()) {
      errs.cuit = t('auth.errors.fieldRequired');
    } else if (!validarCuit(cuit)) {
      errs.cuit = t('auth.errors.invalidCuit');
    }

    if (!tipoCuenta) errs.tipoCuenta = t('auth.errors.fieldRequired');
    if (!nombreCompleto.trim()) errs.nombreCompleto = t('auth.errors.fieldRequired');

    if (!email.trim()) {
      errs.email = t('auth.errors.fieldRequired');
    } else {
      const result = RegistrarEmpresaRequestSchema.shape.email.safeParse(email);
      if (!result.success) errs.email = t(result.error.errors[0].message as any);
    }

    if (!telefono.trim()) errs.telefono = t('auth.errors.fieldRequired');

    if (!password) {
      errs.password = t('auth.errors.fieldRequired');
    } else {
      const result = RegistrarEmpresaRequestSchema.shape.password.safeParse(password);
      if (!result.success) errs.password = t(result.error.errors[0].message as any);
    }

    if (!confirmPassword) {
      errs.confirmPassword = t('auth.errors.fieldRequired');
    } else if (password !== confirmPassword) {
      errs.confirmPassword = t('auth.errors.passwordMismatch');
    }

    if (!aceptaTerminos) errs.aceptaTerminos = t('auth.errors.termsRequired');

    return errs;
  }, [formData, t]);

  // Validez reactiva del formulario
  const isFormValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      setShowAllErrors(true);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.registrarEmpresa({
        nombreEmpresa: formData.nombreEmpresa,
        cuit: formData.cuit.replace(/[^\d]/g, ''), // Enviar normalizado
        tipoCuenta: formData.tipoCuenta,
        email: formData.email,
        password: formData.password,
        nombreCompleto: formData.nombreCompleto,
        telefono: formData.telefono,
        aceptaTerminosYCondiciones: formData.aceptaTerminos as true,
        googleToken: googleTokenRef.current,
      });

      setSuccessData({
        usuarioId: response.usuarioId,
        organizacionId: response.organizacionId,
        nombreOrganizacion: formData.nombreEmpresa,
      });
      setEmailVerificado(response.emailVerificado);
      setTelefonoVerificado(!response.requiereVerificacionTelefono);
      setStep('verificacion');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.errors.registerError');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!successData) return;

    // Validacion por campo
    let hasFieldError = false;
    setCodigoEmailError('');
    setCodigoTelefonoError('');

    if (!emailVerificado) {
      if (!codigoEmail.trim()) {
        setCodigoEmailError(t('auth.errors.emailCodeRequired'));
        hasFieldError = true;
      } else if (!/^\d{6}$/.test(codigoEmail)) {
        setCodigoEmailError(t('auth.errors.codeFormat'));
        hasFieldError = true;
      }
    }
    if (!telefonoVerificado) {
      if (!codigoTelefono.trim()) {
        setCodigoTelefonoError(t('auth.errors.smsCodeRequired'));
        hasFieldError = true;
      } else if (!/^\d{6}$/.test(codigoTelefono)) {
        setCodigoTelefonoError(t('auth.errors.codeFormat'));
        hasFieldError = true;
      }
    }
    if (hasFieldError) return;

    setIsLoading(true);
    setError('');

    try {
      const payload: { usuarioId: string; codigoEmail?: string; codigoTelefono?: string } = { usuarioId: successData.usuarioId };

      if (!emailVerificado) {
        payload.codigoEmail = codigoEmail;
      }
      if (!telefonoVerificado) {
        payload.codigoTelefono = codigoTelefono;
      }

      const response = await authApi.verificarCuenta(payload);

      // Actualizar estados locales de verificación
      const isEmailOk = response.emailVerificado ?? true;
      const isTelefonoOk = response.telefonoVerificado ?? true;

      if (isEmailOk && !emailVerificado) {
        setEmailVerificado(true);
        setEmailSuccess(t('auth.success.emailVerified'));
      }
      if (isTelefonoOk && !telefonoVerificado) {
        setTelefonoVerificado(true);
        setTelefonoSuccess(t('auth.success.phoneVerified'));
      }

      // Si ambos están verificados, proceder al login usando hydration centralizada
      if (isEmailOk && isTelefonoOk) {
        hydrateAuthenticatedSession(response, response.token);
        navigate('/', { replace: true });
      } else {
        // Limpiar códigos ya usados
        if (isEmailOk) setCodigoEmail('');
        if (isTelefonoOk) setCodigoTelefono('');
      }

    } catch (err: any) {
      // El backend puede retornar 403 (No verificado) o 400 (Código inválido)
      // con información de verif parcial en el body
      if ((err.status === 400 || err.status === 403) && err.problemDetails) {
        const details = err.problemDetails;
        const isEmailOk = details.emailVerificado ?? false;
        const isTelefonoOk = details.telefonoVerificado ?? false;

        if (isEmailOk && !emailVerificado) {
          setEmailVerificado(true);
          setEmailSuccess(t('auth.success.emailVerified'));
          setCodigoEmail('');
        }
        if (isTelefonoOk && !telefonoVerificado) {
          setTelefonoVerificado(true);
          setTelefonoSuccess(t('auth.success.phoneVerified'));
          setCodigoTelefono('');
        }
      }

      const message = err instanceof Error ? err.message : t('auth.errors.verifyError');

      // Mostrar error debajo del campo correspondiente si el mensaje lo indica
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('email') || lowerMessage.includes('correo')) {
        setCodigoEmailError(message);
      } else if (lowerMessage.includes('sms') || lowerMessage.includes('teléfono') || lowerMessage.includes('telefono')) {
        setCodigoTelefonoError(message);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReenviarCodigo = async (canal: 'email' | 'sms') => {
    if (!successData || isResending) return;

    setIsResending(canal);
    setError('');
    setResendSuccess('');

    try {
      await authApi.reenviarCodigo({
        email: formData.email,
        canal: canal === 'email' ? 1 : 2,
      });
      setResendSuccess(
        canal === 'email'
          ? t('auth.success.codeResentEmail')
          : t('auth.success.codeResentSms')
      );
      // Limpiar mensaje de exito despues de 5 segundos
      setTimeout(() => setResendSuccess(''), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.errors.resendError');
      setError(message);
    } finally {
      setIsResending(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary">
            <Car size={30} className="text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-text">{t('auth.title')}</h1>
            <p className="text-text-muted mt-1">{t('auth.subtitle')}</p>
          </div>
        </div>
        {/* Back button */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text mb-4"
        >
          <ArrowLeft size={16} />
          {t('auth.backToLogin')}
        </Link>
        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border px-8 py-6">
          {step === 'datos' ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-left">
                  <Building2 size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-text">{t('auth.registerTitle')}</h2>
                  <p className="text-sm text-text-muted">{t('auth.registerSubtitle')}</p>
                </div>
              </div>
              {/* Form */}
              <form onSubmit={handleRegistro} noValidate className="space-y-4">
                {/* Empresa */}
                <Input
                  label={
                    <span>
                      {t('auth.companyNameLabel')} <span className="text-error">*</span>
                    </span>
                  }
                  type="text"
                  name="organization"
                  value={formData.nombreEmpresa}
                  onChange={(e) => updateField('nombreEmpresa', e.target.value)}
                  placeholder={t('auth.companyNamePlaceholder')}
                  autoComplete="organization"
                  disabled={isLoading}
                  onFocus={() => handleFocus('nombreEmpresa')}
                  onBlur={() => handleBlur('nombreEmpresa')}
                  error={(touched.nombreEmpresa || showAllErrors) ? errors.nombreEmpresa : ''}
                />

                {/* CUIT */}
                <Input
                  label={
                    <span>
                      {t('auth.cuitLabel')} <span className="text-error">*</span>
                    </span>
                  }
                  type="text"
                  value={formData.cuit}
                  onChange={(e) => updateField('cuit', formatCuit(e.target.value))}
                  placeholder={t('auth.cuitPlaceholder')}
                  disabled={isLoading}
                  name="cuit"
                  onFocus={() => handleFocus('cuit')}
                  onBlur={() => handleBlur('cuit')}
                  error={(touched.cuit || showAllErrors) ? errors.cuit : ''}
                />

                {/* Tipo de Organización */}
                <div className="space-y-1.5">
                  <Select
                    label={
                      <span>
                        {t('auth.orgTypeLabel')} <span className="text-error">*</span>
                      </span>
                    }
                    value={formData.tipoCuenta || ''}
                    onChange={(val) => {
                      updateField('tipoCuenta', Number(val));
                    }}
                    options={tiposOrganizacion}
                    placeholder={t('auth.selectOrgType')}
                    disabled={isLoading}
                    onFocus={() => handleFocus('tipoCuenta')}
                    onBlur={() => handleBlur('tipoCuenta')}
                    error={(touched.tipoCuenta || showAllErrors) ? errors.tipoCuenta : ''}
                  />
                </div>


                {/* Usuario */}
                <Input
                  label={
                    <span>
                      {t('auth.fullNameLabel')} <span className="text-error">*</span>
                    </span>
                  }
                  type="text"
                  name="name"
                  value={formData.nombreCompleto}
                  onChange={(e) => updateField('nombreCompleto', e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  autoComplete="off"
                  disabled={isLoading}
                  onFocus={() => handleFocus('nombreCompleto')}
                  onBlur={() => handleBlur('nombreCompleto')}
                  error={(touched.nombreCompleto || showAllErrors) ? errors.nombreCompleto : ''}
                />
                {/* Email */}
                <Input
                  label={
                    <span>
                      {t('auth.emailLabelRegister')} <span className="text-error">*</span>
                    </span>
                  }
                  type="email"
                  name="email"
                  ref={emailInputRef}
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={t('auth.emailPlaceholderRegister')}
                  autoComplete="off"
                  disabled={isLoading || isGoogleRegistro}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  error={(touched.email || showAllErrors) ? errors.email : ''}
                />
                {/* Telefono */}
                <Input
                  label={
                    <span>
                      {t('auth.phoneLabel')} <span className="text-error">*</span>
                    </span>
                  }
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  placeholder={t('auth.phonePlaceholder')}
                  autoComplete="off"
                  disabled={isLoading}
                  onFocus={() => handleFocus('telefono')}
                  onBlur={() => handleBlur('telefono')}
                  error={(touched.telefono || showAllErrors) ? errors.telefono : ''}
                />
                {/* Password */}
                <Input
                  label={
                    <span>
                      {t('auth.passwordLabelRegister')} <span className="text-error">*</span>
                    </span>
                  }
                  type={showPassword ? 'text' : 'password'}
                  ref={passwordInputRef}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder={t('auth.passwordPlaceholderRegister')}
                  name="password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                  error={(touched.password || showAllErrors) ? errors.password : ''}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-text-muted hover:text-text focus:outline-none flex items-center"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />
                {/* Confirmar Password */}
                <Input
                  label={
                    <span>
                      {t('auth.confirmPasswordLabel')} <span className="text-error">*</span>
                    </span>
                  }
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  name="confirmPassword"
                  autoComplete="new-password"
                  disabled={isLoading}
                  onFocus={() => handleFocus('confirmPassword')}
                  onBlur={() => handleBlur('confirmPassword')}
                  error={(touched.confirmPassword || showAllErrors) ? errors.confirmPassword : ''}
                />
                {error && (
                  <Alert type="error" message={error} />
                )}
                {/* Legal */}
                <div className="pb-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    className="mt-1 w-4 h-4 rounded-sm border-border bg-white checked:bg-white checked:border-gray-400 checked:text-primary focus:ring-2 focus:rounded focus:ring-offset-0 focus:outline-none cursor-pointer"
                    checked={formData.aceptaTerminos}
                    onChange={(e) => updateField('aceptaTerminos', e.target.checked)}
                  />
                  <label htmlFor="acceptTerms" className="text-justify text-xs text-text-muted cursor-pointer">
                    {t('auth.legalRegister')}
                  </label>
                </div>
                {showAllErrors && errors.aceptaTerminos && (
                  <p className="text-xs text-error -mt-3 mb-4">{errors.aceptaTerminos}</p>
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
                      {t('auth.registering')}
                    </>
                  ) : (
                    t('auth.createAccount')
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Mail size={20} className="text-success" />
                </div>
                <div>
                  <h2 className="font-semibold text-text">{t('auth.verifyTitle')}</h2>
                  <p className="text-sm text-text-muted">{t('auth.verifySubtitle')}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6">
                <p className="text-sm text-text">
                  {t('auth.verifyMessage')}
                </p>
              </div>


              <form onSubmit={handleVerificar} noValidate className="space-y-4">
                {emailVerificado && emailSuccess && (
                  <Alert type="success" message={emailSuccess} />
                )}
                {!emailVerificado && (
                  <Input
                    label={t('auth.emailCodeLabel')}
                    type="text"
                    value={codigoEmail}
                    onChange={(e) => { setCodigoEmail(e.target.value); setCodigoEmailError(''); }}
                    placeholder={t('auth.emailCodePlaceholder')}
                    disabled={isLoading}
                    maxLength={6}
                    error={codigoEmailError}
                  />
                )}

                {telefonoVerificado && telefonoSuccess && (
                  <Alert type="success" message={telefonoSuccess} />
                )}
                {!telefonoVerificado && (
                  <Input
                    label={t('auth.smsCodeLabel')}
                    type="text"
                    value={codigoTelefono}
                    onChange={(e) => { setCodigoTelefono(e.target.value); setCodigoTelefonoError(''); }}
                    placeholder={t('auth.smsCodePlaceholder')}
                    disabled={isLoading}
                    maxLength={6}
                    error={codigoTelefonoError}
                  />
                )}

                {error && (
                  <Alert type="error" message={error} />
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
                      {t('auth.verifying')}
                    </>
                  ) : (
                    t('auth.verifyButton')
                  )}
                </Button>

                {/* Botones de reenvio */}
                <div className="flex flex-wrap gap-3 justify-center pt-2 items-center">
                  {!emailVerificado && (
                    <button
                      type="button"
                      onClick={() => handleReenviarCodigo('email')}
                      disabled={isResending !== null}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending === 'email' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      {t('auth.resendEmail')}
                    </button>
                  )}

                  {!emailVerificado && !telefonoVerificado && (
                    <span className="text-text-muted px-1">|</span>
                  )}

                  {!telefonoVerificado && (
                    <button
                      type="button"
                      onClick={() => handleReenviarCodigo('sms')}
                      disabled={isResending !== null}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending === 'sms' ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      {t('auth.resendSms')}
                    </button>
                  )}
                </div>

                {/* Mensaje de éxito de reenvío sutil */}
                {resendSuccess && (
                  <p className="text-center text-xs text-success mt-3 flex items-center justify-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <CheckCircle size={14} />
                    {resendSuccess}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}



