import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Ban, Car, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { invitacionesApi } from '@/services/endpoints';
import { InvitacionDto, PasswordSchema } from '@/shared/types/api';
import { Button, Input, Alert } from '@/shared/ui';
import { useErrorHandler } from '@/hooks';

// Esquema de validación alineado con el registro
const AceptarInvitacionSchema = z.object({
  nombreCompleto: z.string().min(2, "auth.errors.fieldRequired"),
  telefono: z.string().min(1, "auth.errors.fieldRequired").regex(/^[\d\+\-\s\(\)]+$/, "auth.invalidPhone").max(20, "auth.errors.phoneMaxLength"),
  password: PasswordSchema,
  confirmPassword: z.string().min(1, "auth.errors.fieldRequired"),
  aceptaTerminos: z.boolean().refine((val) => val === true, {
    message: "auth.errors.termsRequired",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "auth.errors.passwordMismatch",
  path: ["confirmPassword"],
});

type AceptarInvitacionFormData = z.infer<typeof AceptarInvitacionSchema>;

type PageState = 'loading' | 'valid' | 'expired' | 'invalid' | 'cancelled' | 'already_accepted' | 'success' | 'error';

export function AcceptInvitationPage() {
  const { token: pathToken } = useParams<{ token: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Soporte para tokens tanto en el path /invitacion/:token como en el query /invitacion?token=:token
  const queryToken = new URLSearchParams(location.search).get('token');
  const token = pathToken || queryToken;
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<InvitacionDto | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting, isSubmitted, touchedFields, dirtyFields },
    setValue,
    watch,
    trigger,
  } = useForm<AceptarInvitacionFormData>({
    resolver: zodResolver(AceptarInvitacionSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      nombreCompleto: '',
      password: '',
      confirmPassword: '',
      telefono: '',
      aceptaTerminos: false,
    }
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
        const parsed = handleApiError(err, { showToast: false });
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

  const onFormSubmit = async (data: AceptarInvitacionFormData) => {
    if (!token) return;
    setGeneralError('');

    try {
      await invitacionesApi.aceptarInvitacion(token, {
        nombreCompleto: data.nombreCompleto,
        password: data.password,
        telefono: data.telefono,
      });
      setPageState('success');
    } catch (err: unknown) {
      const parsed = handleApiError(err, { showToast: false });
      setGeneralError(parsed.message);
    }
  };

  // Loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-text-muted">{t('invitations.validating')}</p>
        </div>
      </div>
    );
  }

  // Error states
  if (pageState === 'expired' || pageState === 'invalid' || pageState === 'already_accepted' || pageState === 'cancelled') {
    const messages = {
      expired: {
        icon: <AlertTriangle className="w-16 h-16 text-amber-500" />,
        title: t('invitations.expired.title'),
        text: t('invitations.expired.text'),
      },
      invalid: {
        icon: <XCircle className="w-16 h-16 text-red-500" />,
        title: t('invitations.invalid.title'),
        text: t('invitations.invalid.text'),
      },
      cancelled: {
        icon: <Ban className="w-16 h-16 text-red-400" />,
        title: t('invitations.cancelled.title'),
        text: t('invitations.cancelled.text'),
      },
      already_accepted: {
        icon: <CheckCircle className="w-16 h-16 text-blue-500" />,
        title: t('invitations.alreadyAccepted.title'),
        text: t('invitations.alreadyAccepted.text'),
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
            <Button variant="primary">{t('invitations.goToLogin')}</Button>
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
          <h1 className="text-2xl font-bold text-text mb-2">{t('invitations.success.title')}</h1>
          <p className="text-text-muted mb-6">
            {t('invitations.success.text')}
          </p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            {t('invitations.login')}
          </Button>
        </div>
      </div>
    );
  }

  // Valid invitation - show form
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 pt-6">
      <div className="w-full max-w-md">
        {/* Logo and App Name */}
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

        <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-text">
                {t('invitations.joinOrg', { org: invitation?.nombreOrganizacion })}
              </h2>
              <p className="text-text-muted text-sm">{t('invitations.subtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="space-y-4">
            {/* Nombre Completo */}
            <Input
              label={
                <span>
                  {t('invitations.form.fullName')} <span className="text-error">*</span>
                </span>
              }
              {...register('nombreCompleto')}
              placeholder={t('invitations.form.fullNamePlaceholder')}
              autoComplete="off"
              onFocus={() => setFocusedField('nombreCompleto')}
              onBlur={(e) => {
                register('nombreCompleto').onBlur(e);
                setFocusedField(null);
                trigger('nombreCompleto');
              }}
              error={(focusedField !== 'nombreCompleto' && (touchedFields.nombreCompleto || dirtyFields.nombreCompleto || isSubmitted)) ? (formErrors.nombreCompleto?.message ? t(formErrors.nombreCompleto.message as any) : '') : ''}
              disabled={isSubmitting}
            />

            {/* Rol (Readonly) */}
            <Input
              label={t('invitations.form.role')}
              value={invitation?.rolAsignado || ''}
              readOnly
              disabled
              placeholder={t('invitations.form.role')}
              className="bg-background cursor-not-allowed opacity-80"
            />

            {/* Email (Readonly) */}
            <Input
              label={t('invitations.form.email')}
              value={invitation?.email || ''}
              readOnly
              disabled
              className="bg-background cursor-not-allowed opacity-80"
            />

            {/* Teléfono */}
            <Input
              label={
                <span>
                  {t('invitations.form.phone')} <span className="text-error">*</span>
                </span>
              }
              type="tel"
              value={watch('telefono')}
              onChange={(e) => {
                const val = (e.target as HTMLInputElement).value;
                setValue('telefono', val, { shouldValidate: true, shouldDirty: true });
              }}
              placeholder={t('invitations.form.phonePlaceholder')}
              autoComplete="off"
              onFocus={() => setFocusedField('telefono')}
              onBlur={() => {
                setFocusedField(null);
                setValue('telefono', watch('telefono'), { shouldTouch: true });
                trigger('telefono');
              }}
              error={(focusedField !== 'telefono' && (touchedFields.telefono || dirtyFields.telefono || isSubmitted)) ? (formErrors.telefono?.message ? t(formErrors.telefono.message as any) : '') : ''}
              disabled={isSubmitting}
            />

            {/* Contraseña */}
            <Input
              label={
                <span>
                  {t('invitations.form.password')} <span className="text-error">*</span>
                </span>
              }
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              onFocus={() => setFocusedField('password')}
              onBlur={(e) => {
                register('password').onBlur(e);
                setFocusedField(null);
                trigger('password');
              }}
              placeholder={t('invitations.form.passwordPlaceholder')}
              autoComplete="new-password"
              error={(focusedField !== 'password' && (touchedFields.password || dirtyFields.password || isSubmitted)) ? (formErrors.password?.message ? t(formErrors.password.message as any) : '') : ''}
              disabled={isSubmitting}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-text-muted hover:text-text focus:outline-none flex items-center"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {/* Confirmar Contraseña */}
            <Input
              label={
                <span>
                  {t('invitations.form.confirmPassword')} <span className="text-error">*</span>
                </span>
              }
              type={showPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={(e) => {
                register('confirmPassword').onBlur(e);
                setFocusedField(null);
                trigger('confirmPassword');
              }}
              placeholder={t('invitations.form.confirmPasswordPlaceholder')}
              autoComplete="new-password"
              error={(focusedField !== 'confirmPassword' && (touchedFields.confirmPassword || dirtyFields.confirmPassword || isSubmitted)) ? (formErrors.confirmPassword?.message ? t(formErrors.confirmPassword.message as any) : '') : ''}
              disabled={isSubmitting}
            />

            {generalError && (
              <Alert type="error" message={generalError} />
            )}

            {/* Legal */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="acceptTerms"
                {...register('aceptaTerminos')}
                onFocus={() => setFocusedField('aceptaTerminos')}
                onBlur={(e) => {
                  register('aceptaTerminos').onBlur(e);
                  setFocusedField(null);
                }}
                className="mt-1 w-4 h-4 rounded-sm border-border bg-white checked:bg-white checked:border-gray-400 checked:text-primary focus:ring-2 focus:rounded focus:ring-offset-0 focus:outline-none cursor-pointer"
              />
              <label htmlFor="acceptTerms" className="text-justify text-xs text-text-muted cursor-pointer">
                {t('auth.legalRegister')}
              </label>
            </div>
            {focusedField !== 'aceptaTerminos' && (touchedFields.aceptaTerminos || isSubmitted) && formErrors.aceptaTerminos && (
              <p className="text-xs text-error mt-1">{t(formErrors.aceptaTerminos.message as any)}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-8"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('invitations.form.creating')}
                </>
              ) : (
                t('invitations.form.submit')
              )}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-text-muted inline-block">
            {t('invitations.alreadyHaveAccount', '¿Ya es usuario?')}
          </p>
          <Link
            to="/login"
            className="inline-block text-primary font-semibold hover:underline transition-all pl-2"
          >
            {t('invitations.login', 'Iniciar Sesión')}
          </Link>
        </div>
      </div>
    </div>
  );
}
