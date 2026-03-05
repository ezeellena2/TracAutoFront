import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Car, Eye, EyeOff, Loader2, ArrowLeft, Building2, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { Button, Input, Select, Alert } from '@/shared/ui';
import { authApi, organizacionesApi } from '@/services/endpoints';
import { useAuthStore, useTenantStore } from '@/store';

/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * Solo para uso en cliente — la verificación real ocurre en el backend.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/** Extrae el rol del JWT. Soporta claim 'role' y el claim largo de ASP.NET Identity. */
function extractRoleFromToken(token: string): 'Admin' | 'Operador' | 'Analista' {
  const payload = decodeJwtPayload(token);
  if (!payload) return 'Operador';
  const roleClaim =
    (payload['role'] as string | undefined) ??
    (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string | undefined);
  const rolMap: Record<string, 'Admin' | 'Operador' | 'Analista'> = {
    Admin: 'Admin',
    Administrador: 'Admin',
    Operador: 'Operador',
    Analista: 'Analista',
  };
  return rolMap[roleClaim ?? ''] ?? 'Operador';
}

/**
 * Página de Registro de Empresa B2B
 * Flujo: Datos → Registro → Verificación → Auto-login → Dashboard
 */
export function RegistroPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  // const { login } = useAuthStore(); // Removed: accessed directly via getState() to ensure latest state and consistency

  // Verificar si viene en modo verificación o con datos de Google desde LoginPage
  const state = location.state as {
    modoVerificacion?: boolean;
    email?: string;
    usuarioId?: string;
    organizacionId?: string;
    nombreOrganizacion?: string;
    emailVerificado?: boolean;
    telefonoVerificado?: boolean;
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
    tipoOrganizacion: 0, // 0 = no seleccionado
    nombreCompleto: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    aceptaTerminos: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Verification
  const [codigoEmail, setCodigoEmail] = useState('');
  const [codigoTelefono, setCodigoTelefono] = useState('');
  const [emailVerificado, setEmailVerificado] = useState<boolean>(false);
  const [telefonoVerificado, setTelefonoVerificado] = useState<boolean>(false);
  const [codigoEmailError, setCodigoEmailError] = useState('');
  const [codigoTelefonoError, setCodigoTelefonoError] = useState('');

  // Inicializar datos si viene en modo verificación o con datos de Google
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

  // Ref para que handleBlur siempre lea el valor más reciente
  // (necesario porque commitE164 del PhoneInput llama updateField y luego onBlur en el mismo tick)
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const updateField = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      formDataRef.current = next;
      return next;
    });
    setError('');
    // Limpiar error inline del campo al escribir
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFocus = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = formDataRef.current[field as keyof typeof formData];
    if (typeof value === 'string' && !value.trim()) {
      setFieldErrors(prev => ({ ...prev, [field]: t('auth.errors.fieldRequired') }));
    } else if (typeof value === 'number' && value === 0) {
      setFieldErrors(prev => ({ ...prev, [field]: t('auth.errors.fieldRequired') }));
    } else if (field === 'cuit' && formData.cuit && !validarCuit(formData.cuit)) {
      setFieldErrors(prev => ({ ...prev, cuit: t('auth.errors.invalidCuit') }));
    } else if (field === 'email' && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFieldErrors(prev => ({ ...prev, email: t('auth.errors.invalidEmail') }));
    } else if (field === 'password' && formData.password) {
      let pwErr = '';
      if (formData.password.length < 8) pwErr = t('auth.errors.passwordMinLength');
      else if (!/[A-Z]/.test(formData.password)) pwErr = t('auth.errors.passwordUppercase');
      else if (!/[a-z]/.test(formData.password)) pwErr = t('auth.errors.passwordLowercase');
      else if (!/[0-9]/.test(formData.password)) pwErr = t('auth.errors.passwordNumber');
      else if (!/[^a-zA-Z0-9]/.test(formData.password)) pwErr = t('auth.errors.passwordSpecial');
      if (pwErr) setFieldErrors(prev => ({ ...prev, password: pwErr }));
    } else if (field === 'confirmPassword' && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: t('auth.errors.passwordMismatch') }));
    }
  };

  // Formatear CUIT: XX-XXXXXXXX-X
  const formatCuit = (value: string) => {
    // Solo números, máx 11 dígitos
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

  // Validación de CUIT argentino (algoritmo módulo 11)
  const validarCuit = (cuit: string): boolean => {
    // Normalizar: remover guiones y espacios
    const cuitNormalizado = cuit.replace(/[^\d]/g, '');

    if (cuitNormalizado.length !== 11) return false;

    // Validar tipos válidos (primeros 2 dígitos)
    const tipo = parseInt(cuitNormalizado.substring(0, 2), 10);
    const tiposValidos = [20, 23, 24, 27, 30, 33, 34];
    if (!tiposValidos.includes(tipo)) return false;

    // Calcular dígito verificador (módulo 11)
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

  // Tipos de organización disponibles
  const tiposOrganizacion = [
    { value: 1, label: t('auth.orgTypes.flotaPrivada') },
    { value: 2, label: t('auth.orgTypes.aseguradora') },
    { value: 3, label: t('auth.orgTypes.tallerMecanico') },
    { value: 4, label: t('auth.orgTypes.concesionario') },
    { value: 5, label: t('auth.orgTypes.empresaRenting') },
  ];

  // Validez reactiva del formulario
  const isFormValid = useMemo(() => {
    const { nombreEmpresa, cuit, tipoOrganizacion, nombreCompleto, email, telefono, password, confirmPassword, aceptaTerminos } = formData;
    // Campos no vacíos
    if (!nombreEmpresa.trim() || !cuit.trim() || !tipoOrganizacion || !nombreCompleto.trim() || !email.trim() || !telefono.trim() || !password || !confirmPassword) return false;
    // CUIT válido
    if (!validarCuit(cuit)) return false;
    // Email válido
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    // Password requisitos
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[^a-zA-Z0-9]/.test(password)) return false;
    // Passwords coinciden
    if (password !== confirmPassword) return false;
    // Términos aceptados
    if (!aceptaTerminos) return false;
    // Sin errores de campo activos
    if (Object.values(fieldErrors).some(e => e)) return false;
    return true;
  }, [formData, fieldErrors]);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.registrarEmpresa({
        nombreEmpresa: formData.nombreEmpresa,
        cuit: formData.cuit.replace(/[^\d]/g, ''), // Enviar normalizado
        tipoOrganizacion: formData.tipoOrganizacion,
        email: formData.email,
        password: formData.password,
        nombreCompleto: formData.nombreCompleto,
        telefono: formData.telefono,
        aceptaTerminosYCondiciones: formData.aceptaTerminos as true,
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

    // Validación por campo
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
      const payload: any = { usuarioId: successData.usuarioId };

      if (!emailVerificado) {
        payload.codigoEmail = codigoEmail;
      }
      if (!telefonoVerificado) {
        payload.codigoTelefono = codigoTelefono;
      }


      const response = await authApi.verificarCuenta(payload);

      // Verificación exitosa - auto-login con el token recibido
      // F01-C01: Extraer rol real del JWT en lugar de hardcodear 'Admin'
      const rolReal = extractRoleFromToken(response.token);
      useAuthStore.getState().login(
        {
          id: successData.usuarioId,
          nombre: formData.nombreCompleto,
          email: formData.email,
          rol: rolReal,
          organizationId: successData.organizacionId,
          organizationName: successData.nombreOrganizacion,
        },
        response.token
      );

      // P0-FIX: Cargar datos de la organización en tenantStore para que se muestre el nombre/branding
      try {
        const orgDto = await organizacionesApi.getOrganizacionById(successData.organizacionId);
        useTenantStore.getState().setOrganizationFromDto(orgDto);
      } catch (orgError) {
        console.error('Error loading organization details after verify:', orgError);
        // F01-M03: Fallback sin tipoOrganizacion del formulario (puede diferir del backend)
        useTenantStore.getState().setOrganization({
          id: successData.organizacionId,
          name: successData.nombreOrganizacion,
          logo: '',
          theme: {}
        });
      }

      // Redirigir al dashboard
      navigate('/', { replace: true });

    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.errors.verifyError');
      setError(message);
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
      // Limpiar mensaje de éxito después de 5 segundos
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
                  error={touched.nombreEmpresa ? fieldErrors.nombreEmpresa : ''}
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
                  onFocus={() => handleFocus('cuit')}
                  onBlur={() => handleBlur('cuit')}
                  error={touched.cuit ? fieldErrors.cuit : ''}
                />

                {/* Tipo de Organización */}
                <div className="space-y-1.5">
                  <Select
                    label={
                      <span>
                        {t('auth.orgTypeLabel')} <span className="text-error">*</span>
                      </span>
                    }
                    value={formData.tipoOrganizacion || ''}
                    onChange={(val) => {
                      updateField('tipoOrganizacion', Number(val));
                      if (fieldErrors.tipoOrganizacion) setFieldErrors(prev => ({ ...prev, tipoOrganizacion: '' }));
                    }}
                    options={tiposOrganizacion}
                    placeholder={t('auth.selectOrgType')}
                    disabled={isLoading}
                  />
                  {touched.tipoOrganizacion && fieldErrors.tipoOrganizacion && (
                    <p className="mt-1.5 text-sm text-error">{fieldErrors.tipoOrganizacion}</p>
                  )}
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
                  autoComplete="name"
                  disabled={isLoading}
                  onFocus={() => handleFocus('nombreCompleto')}
                  onBlur={() => handleBlur('nombreCompleto')}
                  error={touched.nombreCompleto ? fieldErrors.nombreCompleto : ''}
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
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={t('auth.emailPlaceholderRegister')}
                  autoComplete="email"
                  disabled={isLoading || isGoogleRegistro}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  error={touched.email ? fieldErrors.email : ''}
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
                  autoComplete="tel"
                  disabled={isLoading}
                  onFocus={() => handleFocus('telefono')}
                  onBlur={() => handleBlur('telefono')}
                  error={touched.telefono ? fieldErrors.telefono : ''}
                />
                {/* Password */}
                <Input
                  label={
                    <span>
                      {t('auth.passwordLabelRegister')} <span className="text-error">*</span>
                    </span>
                  }
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder={t('auth.passwordPlaceholderRegister')}
                  autoComplete="new-password"
                  disabled={isLoading}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                  error={touched.password ? fieldErrors.password : ''}
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
                  autoComplete="new-password"
                  disabled={isLoading}
                  onFocus={() => handleFocus('confirmPassword')}
                  onBlur={() => handleBlur('confirmPassword')}
                  error={touched.confirmPassword ? fieldErrors.confirmPassword : ''}
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


                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading || !isFormValid}
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

              {/* Mensaje de éxito de reenvío */}
              {resendSuccess && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm mb-4 flex items-center gap-2">
                  <CheckCircle size={16} />
                  {resendSuccess}
                </div>
              )}

              <form onSubmit={handleVerificar} noValidate className="space-y-4">
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

                {/* Botones de reenvío */}
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
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
