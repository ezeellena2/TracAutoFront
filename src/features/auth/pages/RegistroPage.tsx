import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Eye, EyeOff, Loader2, ArrowLeft, Building2, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { authApi } from '@/services/endpoints';
import { useAuthStore } from '@/store';

/**
 * Página de Registro de Empresa B2B
 * Flujo: Datos → Registro → Verificación → Auto-login → Dashboard
 */
export function RegistroPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [step, setStep] = useState<'datos' | 'verificacion'>('datos');
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
    nombreCompleto: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Verification
  const [codigoEmail, setCodigoEmail] = useState('');
  const [codigoTelefono, setCodigoTelefono] = useState('');

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }
    
    if (formData.password.length < 8) {
      setError(t('auth.errors.passwordMinLength'));
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.registrarEmpresa({
        nombreEmpresa: formData.nombreEmpresa,
        email: formData.email,
        password: formData.password,
        nombreCompleto: formData.nombreCompleto,
        telefono: formData.telefono || undefined,
        tipoOrganizacion: 2, // Aseguradora por defecto
      });
      
      setSuccessData({
        usuarioId: response.usuarioId,
        organizacionId: response.organizacionId,
        nombreOrganizacion: formData.nombreEmpresa,
      });
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
    
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.verificarCuenta({
        usuarioId: successData.usuarioId,
        codigoEmail: codigoEmail,
        codigoTelefono: codigoTelefono || undefined,
      });
      
      // Verificación exitosa - auto-login con el token recibido
      login(
        {
          id: successData.usuarioId,
          nombre: formData.nombreCompleto,
          email: formData.email,
          rol: 'Admin', // Dueño de empresa = Admin
          organizationId: successData.organizacionId,
          organizationName: successData.nombreOrganizacion,
        },
        response.token
      );
      
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

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border p-8">
          {/* Back button */}
          <Link 
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text mb-6"
          >
            <ArrowLeft size={16} />
            {t('auth.backToLogin')}
          </Link>

          {step === 'datos' ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-text">{t('auth.registerTitle')}</h2>
                  <p className="text-sm text-text-muted">{t('auth.registerSubtitle')}</p>
                </div>
              </div>

              <form onSubmit={handleRegistro} className="space-y-4">
                {/* Empresa */}
                <Input
                  label={t('auth.companyNameLabel')}
                  type="text"
                  value={formData.nombreEmpresa}
                  onChange={(e) => updateField('nombreEmpresa', e.target.value)}
                  placeholder={t('auth.companyNamePlaceholder')}
                  required
                  disabled={isLoading}
                />

                {/* Usuario */}
                <Input
                  label={t('auth.fullNameLabel')}
                  type="text"
                  value={formData.nombreCompleto}
                  onChange={(e) => updateField('nombreCompleto', e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  required
                  disabled={isLoading}
                />

                <Input
                  label={t('auth.emailLabelRegister')}
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={t('auth.emailPlaceholderRegister')}
                  required
                  disabled={isLoading}
                />

                <Input
                  label={t('auth.phoneLabel')}
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  placeholder={t('auth.phonePlaceholder')}
                  disabled={isLoading}
                />

                <div className="relative">
                  <Input
                    label={t('auth.passwordLabelRegister')}
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder={t('auth.passwordPlaceholderRegister')}
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

                <Input
                  label={t('auth.confirmPasswordLabel')}
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  required
                  disabled={isLoading}
                />

                {error && (
                  <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                    {error}
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
                  {t('auth.verifyMessage')} <strong>{formData.email}</strong>
                  {formData.telefono && (
                    <> {t('common.and')} <strong>{formData.telefono}</strong></>
                  )}
                </p>
              </div>

              {/* Mensaje de éxito de reenvío */}
              {resendSuccess && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm mb-4 flex items-center gap-2">
                  <CheckCircle size={16} />
                  {resendSuccess}
                </div>
              )}

              <form onSubmit={handleVerificar} className="space-y-4">
                <Input
                  label={t('auth.emailCodeLabel')}
                  type="text"
                  value={codigoEmail}
                  onChange={(e) => setCodigoEmail(e.target.value)}
                  placeholder={t('auth.emailCodePlaceholder')}
                  required
                  disabled={isLoading}
                  maxLength={6}
                />

                {formData.telefono && (
                  <Input
                    label={t('auth.smsCodeLabel')}
                    type="text"
                    value={codigoTelefono}
                    onChange={(e) => setCodigoTelefono(e.target.value)}
                    placeholder={t('auth.smsCodePlaceholder')}
                    disabled={isLoading}
                    maxLength={6}
                  />
                )}

                {error && (
                  <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                    {error}
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
                      {t('auth.verifying')}
                    </>
                  ) : (
                    t('auth.verifyButton')
                  )}
                </Button>

                {/* Botones de reenvío */}
                <div className="flex flex-wrap gap-3 justify-center pt-2">
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
                  {formData.telefono && (
                    <>
                      <span className="text-text-muted">|</span>
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
                    </>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        {/* Legal */}
        <p className="mt-6 text-center text-xs text-text-muted">
          {t('auth.legalRegister')}
        </p>
      </div>
    </div>
  );
}
