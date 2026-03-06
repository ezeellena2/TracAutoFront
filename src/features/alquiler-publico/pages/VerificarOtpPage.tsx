import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Car, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { useAuthClienteStore } from '@/store/authCliente.store';
import { authClienteApi } from '@/services/endpoints/alquiler-publico.api';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useBrandingPublico } from '../hooks/useBrandingPublico';

export default function VerificarOtpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { parseError } = useErrorHandler();
  const setAuth = useAuthClienteStore(s => s.setAuth);
  const { branding } = useBrandingPublico();

  const email = searchParams.get('email') || '';
  const redirectTo = searchParams.get('redirect') || '/';

  const [codigo, setCodigo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Countdown para reenvio
  const [countdown, setCountdown] = useState(60);
  const [puedeReenviar, setPuedeReenviar] = useState(false);
  const [isReenviando, setIsReenviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const isSubmittingRef = useRef(false);

  // Si no hay email, redirigir a login
  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    }
  }, [email, navigate]);

  // Timer countdown
  useEffect(() => {
    if (countdown <= 0) {
      setPuedeReenviar(true);
      return;
    }
    const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const verificar = useCallback(async (codigoOtp: string) => {
    if (!codigoOtp || codigoOtp.length !== 6 || isLoading || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    setError('');

    try {
      const resultado = await authClienteApi.verificarOtp({
        email,
        codigo: codigoOtp,
      });

      setAuth({
        token: resultado.token,
        clienteId: resultado.clienteId,
        email: resultado.email,
        nombreCompleto: resultado.nombreCompleto,
        expiresAt: resultado.expiresAt,
      });

      navigate(redirectTo, { replace: true });
    } catch (err) {
      const parsed = parseError(err);
      if (parsed.code === 'ClienteAlquiler.CodigoOtpInvalido') {
        setError(t('alquilerPublico.auth.codigoInvalido'));
      } else {
        setError(parsed.message);
      }
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }, [email, isLoading, setAuth, navigate, redirectTo, parseError, t]);

  const handleVerificar = (e: React.FormEvent) => {
    e.preventDefault();
    verificar(codigo.trim());
  };

  const handleReenviar = useCallback(async () => {
    if (!email) return;

    setIsReenviando(true);
    setError('');
    setMensajeExito('');

    try {
      await authClienteApi.loginCliente({ email });
      setCountdown(60);
      setPuedeReenviar(false);
      setMensajeExito(t('alquilerPublico.auth.codigoReenviado'));
      setTimeout(() => setMensajeExito(''), 5000);
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed.message);
    } finally {
      setIsReenviando(false);
    }
  }, [email, parseError, t]);

  if (!email) return null;

  return (
    <>
    <Helmet>
      <title>{t('alquilerPublico.seo.auth.verificarTitulo')} — {branding.organizacionNombre}</title>
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
            {t('alquilerPublico.auth.verificarTitulo')}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {t('alquilerPublico.auth.verificarSubtitulo')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border p-8">
          {/* Email al que se envio */}
          <p className="text-sm text-text-muted text-center mb-6">
            {t('alquilerPublico.auth.codigoEnviadoA')}{' '}
            <span className="font-medium text-text">{email}</span>
          </p>

          <form onSubmit={handleVerificar} className="space-y-4">
            <Input
              label={t('alquilerPublico.auth.codigoLabel')}
              value={codigo}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCodigo(val);
                setError('');
                // Auto-submit al completar 6 digitos
                if (val.length === 6) {
                  verificar(val);
                }
              }}
              placeholder={t('alquilerPublico.auth.codigoPlaceholder')}
              maxLength={6}
              autoComplete="one-time-code"
              className="text-center text-2xl tracking-[0.5em] font-mono"
              disabled={isLoading}
            />

            {/* Mensaje de exito reenvio */}
            {mensajeExito && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm">
                <CheckCircle size={16} />
                {mensajeExito}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || codigo.trim().length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  {t('alquilerPublico.auth.verificando')}
                </>
              ) : (
                t('alquilerPublico.auth.verificar')
              )}
            </Button>
          </form>

          {/* Reenviar codigo */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            {puedeReenviar ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReenviar}
                disabled={isReenviando}
              >
                {isReenviando ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                    {t('alquilerPublico.auth.reenviando')}
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} className="mr-1.5" />
                    {t('alquilerPublico.auth.reenviarCodigo')}
                  </>
                )}
              </Button>
            ) : (
              <p className="text-sm text-text-muted">
                {t('alquilerPublico.auth.reenviarEn', { segundos: countdown })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
