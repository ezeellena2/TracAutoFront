import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Car, Loader2, Mail } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { useAuthClienteStore, selectIsAuthenticated } from '@/store/authCliente.store';
import { authClienteApi } from '@/services/endpoints/alquiler-publico.api';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useBrandingPublico } from '../hooks/useBrandingPublico';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginClientePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { parseError } = useErrorHandler();
  const isAuthenticated = useAuthClienteStore(selectIsAuthenticated);
  const { branding } = useBrandingPublico();

  const redirectTo = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [esNoEncontrado, setEsNoEncontrado] = useState(false);

  // Redirigir si ya autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEsNoEncontrado(false);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setError(t('alquilerPublico.auth.errores.emailRequerido'));
      return;
    }
    if (!EMAIL_REGEX.test(emailTrimmed)) {
      setError(t('alquilerPublico.auth.errores.emailInvalido'));
      return;
    }

    setIsLoading(true);
    try {
      await authClienteApi.loginCliente({ email: emailTrimmed });
      const params = new URLSearchParams({ email: emailTrimmed });
      if (redirectTo !== '/') params.set('redirect', redirectTo);
      navigate(`/verificar-otp?${params}`);
    } catch (err) {
      const parsed = parseError(err);
      if (parsed.code === 'ClienteAlquiler.NoEncontrado') {
        setEsNoEncontrado(true);
        setError(t('alquilerPublico.auth.noEncontrado'));
      } else {
        setError(parsed.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, t, redirectTo, navigate, parseError]);

  return (
    <>
    <Helmet>
      <title>{t('alquilerPublico.seo.auth.loginTitulo')} — {branding.organizacionNombre}</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.organizacionNombre} className="h-8 w-auto" />
            ) : (
              <Car size={28} className="text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-text">
            {t('alquilerPublico.auth.loginTitulo')}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {t('alquilerPublico.auth.loginSubtitulo')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('alquilerPublico.auth.emailLabel')}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); setEsNoEncontrado(false); }}
              placeholder={t('alquilerPublico.auth.emailPlaceholder')}
              autoComplete="email"
              required
              disabled={isLoading}
            />

            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                <p>{error}</p>
                {esNoEncontrado && (
                  <Link
                    to="/registro"
                    className="inline-flex items-center gap-1.5 mt-2 text-primary hover:underline text-sm font-medium"
                  >
                    <Mail size={14} />
                    {t('alquilerPublico.auth.irARegistro')}
                  </Link>
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
                  {t('alquilerPublico.auth.enviandoCodigo')}
                </>
              ) : (
                t('alquilerPublico.auth.enviarCodigo')
              )}
            </Button>
          </form>

          {/* Link a registro */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-muted">
              {t('alquilerPublico.auth.noTenesCuenta')}{' '}
              <Link to="/registro" className="text-primary hover:underline font-medium">
                {t('alquilerPublico.auth.irARegistro')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
