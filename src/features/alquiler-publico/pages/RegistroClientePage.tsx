import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Car, Loader2 } from 'lucide-react';
import { Button, Input, Select } from '@/shared/ui';
import { TIPO_DOCUMENTO_VALUES } from '@/features/alquileres/types/cliente';
import { useAuthClienteStore, selectIsAuthenticated } from '@/store/authCliente.store';
import { authClienteApi } from '@/services/endpoints/alquiler-publico.api';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useBrandingPublico } from '../hooks/useBrandingPublico';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegistroForm {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  tipoDocumento: number | '';
  numeroDocumento: string;
}

const INITIAL_FORM: RegistroForm = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  tipoDocumento: '',
  numeroDocumento: '',
};

export default function RegistroClientePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { parseError } = useErrorHandler();
  const isAuthenticated = useAuthClienteStore(selectIsAuthenticated);
  const { branding } = useBrandingPublico();

  const [form, setForm] = useState<RegistroForm>(INITIAL_FORM);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [esYaRegistrado, setEsYaRegistrado] = useState(false);

  // Redirigir si ya autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const tipoDocOptions = TIPO_DOCUMENTO_VALUES.map(v => ({
    value: v,
    label: t(`alquilerPublico.reserva.datosPersonales.tipoDoc.${v}`),
  }));

  const updateField = useCallback((partial: Partial<RegistroForm>) => {
    setForm(prev => ({ ...prev, ...partial }));
    const keys = Object.keys(partial);
    setErrores(prev => {
      const next = { ...prev };
      keys.forEach(k => delete next[k]);
      return next;
    });
    setApiError('');
    setEsYaRegistrado(false);
  }, []);

  const validar = useCallback((): boolean => {
    const e: Record<string, string> = {};

    if (!form.nombre.trim()) {
      e.nombre = t('alquilerPublico.auth.errores.nombreRequerido');
    }
    if (!form.apellido.trim()) {
      e.apellido = t('alquilerPublico.auth.errores.apellidoRequerido');
    }
    if (!form.email.trim()) {
      e.email = t('alquilerPublico.auth.errores.emailRequerido');
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      e.email = t('alquilerPublico.auth.errores.emailInvalido');
    }
    if (!form.tipoDocumento) {
      e.tipoDocumento = t('alquilerPublico.auth.errores.tipoDocRequerido');
    }
    if (!form.numeroDocumento.trim()) {
      e.numeroDocumento = t('alquilerPublico.auth.errores.numDocRequerido');
    }

    setErrores(e);
    return Object.keys(e).length === 0;
  }, [form, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;

    setIsLoading(true);
    setApiError('');
    setEsYaRegistrado(false);

    try {
      await authClienteApi.registroCliente({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() || undefined,
        tipoDocumento: Number(form.tipoDocumento),
        numeroDocumento: form.numeroDocumento.trim(),
      });

      const params = new URLSearchParams({
        email: form.email.trim(),
        registro: 'true',
      });
      navigate(`/verificar-otp?${params}`);
    } catch (err) {
      const parsed = parseError(err);
      if (parsed.code === 'ClienteAlquiler.YaRegistrado') {
        setEsYaRegistrado(true);
        setApiError(t('alquilerPublico.auth.yaRegistrado'));
      } else {
        setApiError(parsed.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Helmet>
      <title>{t('alquilerPublico.seo.auth.registroTitulo')} — {branding.organizacionNombre}</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <div className="w-full max-w-lg">
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
            {t('alquilerPublico.auth.registroTitulo')}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {t('alquilerPublico.auth.registroSubtitulo')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre + Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('alquilerPublico.auth.nombre')}
                value={form.nombre}
                onChange={(e) => updateField({ nombre: e.target.value })}
                error={errores.nombre}
                required
                disabled={isLoading}
              />
              <Input
                label={t('alquilerPublico.auth.apellido')}
                value={form.apellido}
                onChange={(e) => updateField({ apellido: e.target.value })}
                error={errores.apellido}
                required
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <Input
              label={t('alquilerPublico.auth.emailLabel')}
              type="email"
              value={form.email}
              onChange={(e) => updateField({ email: e.target.value })}
              placeholder={t('alquilerPublico.auth.emailPlaceholder')}
              error={errores.email}
              autoComplete="email"
              required
              disabled={isLoading}
            />

            {/* Teléfono */}
            <Input
              label={t('alquilerPublico.auth.telefono')}
              type="tel"
              name="telefono"
              value={form.telefono}
              onChange={(e) => updateField({ telefono: e.target.value })}
              disabled={isLoading}
            />

            {/* Tipo Documento + Numero */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t('alquilerPublico.auth.tipoDocumento')}
                value={form.tipoDocumento}
                onChange={(v) => updateField({ tipoDocumento: v === '' ? '' : Number(v) })}
                options={tipoDocOptions}
                placeholder={t('alquilerPublico.auth.seleccionarTipo')}
                error={errores.tipoDocumento}
                required
                disabled={isLoading}
              />
              <Input
                label={t('alquilerPublico.auth.numeroDocumento')}
                value={form.numeroDocumento}
                onChange={(e) => updateField({ numeroDocumento: e.target.value })}
                error={errores.numeroDocumento}
                required
                disabled={isLoading}
              />
            </div>

            {/* Error API */}
            {apiError && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                <p>{apiError}</p>
                {esYaRegistrado && (
                  <Link
                    to="/login"
                    className="inline-block mt-2 text-primary hover:underline text-sm font-medium"
                  >
                    {t('alquilerPublico.auth.irALogin')}
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
                  {t('alquilerPublico.auth.creandoCuenta')}
                </>
              ) : (
                t('alquilerPublico.auth.crearCuenta')
              )}
            </Button>
          </form>

          {/* Link a login */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-muted">
              {t('alquilerPublico.auth.yaTenesCuenta')}{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t('alquilerPublico.auth.irALogin')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
