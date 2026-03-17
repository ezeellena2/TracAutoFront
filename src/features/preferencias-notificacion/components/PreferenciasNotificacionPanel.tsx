import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Mail, Phone, Check, Loader2, Shield } from 'lucide-react';
import { usePreferenciasNotificacion } from '../hooks/usePreferenciasNotificacion';
import { CategoriaNotificacion } from '../types';
import { PageLoader, EstadoError } from '@/shared/ui';

const CATEGORIAS: { value: CategoriaNotificacion; labelKey: string }[] = [
  { value: CategoriaNotificacion.Geofence, labelKey: 'preferenciasNotificacion.categorias.geofence' },
  { value: CategoriaNotificacion.Vehiculo, labelKey: 'preferenciasNotificacion.categorias.vehiculo' },
  { value: CategoriaNotificacion.Conductor, labelKey: 'preferenciasNotificacion.categorias.conductor' },
  { value: CategoriaNotificacion.Sistema, labelKey: 'preferenciasNotificacion.categorias.sistema' },
  { value: CategoriaNotificacion.Seguridad, labelKey: 'preferenciasNotificacion.categorias.seguridad' },
  { value: CategoriaNotificacion.Solicitud, labelKey: 'preferenciasNotificacion.categorias.solicitud' },
  { value: CategoriaNotificacion.Mantenimiento, labelKey: 'preferenciasNotificacion.categorias.mantenimiento' },
  { value: CategoriaNotificacion.Alquiler, labelKey: 'preferenciasNotificacion.categorias.alquiler' },
];

export function PreferenciasNotificacionPanel() {
  const { t } = useTranslation();
  const {
    preferencias,
    cargando,
    guardando,
    enviandoCodigo,
    verificando,
    error,
    codigoEnviado,
    enviarCodigoWhatsApp,
    verificarTelefono,
    toggleWhatsApp,
    toggleEmail,
    actualizarCategoriasWhatsApp,
    recargar,
  } = usePreferenciasNotificacion();

  const [telefono, setTelefono] = useState('');
  const [codigo, setCodigo] = useState('');

  if (cargando) return <PageLoader />;
  if (error) return <EstadoError mensaje={error} onReintentar={() => void recargar()} />;
  if (!preferencias) return null;

  const handleEnviarCodigo = () => {
    if (telefono.trim()) {
      void enviarCodigoWhatsApp(telefono.trim());
    }
  };

  const handleVerificar = () => {
    if (codigo.trim()) {
      void verificarTelefono(codigo.trim());
    }
  };

  const handleToggleCategoria = (cat: CategoriaNotificacion) => {
    const current = preferencias.categoriasWhatsApp ?? CATEGORIAS.map((c) => c.value);
    const updated = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    void actualizarCategoriasWhatsApp(updated.length === CATEGORIAS.length ? null : updated);
  };

  return (
    <div className="space-y-6">
      {/* Email */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Mail className="text-blue-500" size={20} />
            </div>
            <div>
              <h3 className="font-medium text-text">{t('preferenciasNotificacion.email.titulo')}</h3>
              <p className="text-sm text-text-muted">{t('preferenciasNotificacion.email.descripcion')}</p>
            </div>
          </div>
          <button
            onClick={() => void toggleEmail(!preferencias.emailHabilitado)}
            disabled={guardando}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              preferencias.emailHabilitado ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                preferencias.emailHabilitado ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-surface rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <MessageSquare className="text-green-500" size={20} />
            </div>
            <div>
              <h3 className="font-medium text-text">{t('preferenciasNotificacion.whatsapp.titulo')}</h3>
              <p className="text-sm text-text-muted">{t('preferenciasNotificacion.whatsapp.descripcion')}</p>
            </div>
          </div>
          {preferencias.telefonoVerificado && (
            <button
              onClick={() => void toggleWhatsApp(!preferencias.whatsAppHabilitado)}
              disabled={guardando}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferencias.whatsAppHabilitado ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  preferencias.whatsAppHabilitado ? 'translate-x-6' : ''
                }`}
              />
            </button>
          )}
        </div>

        {/* Verificacion de telefono */}
        {!preferencias.telefonoVerificado && !codigoEnviado && (
          <div className="bg-background rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Phone size={16} />
              <span>{t('preferenciasNotificacion.whatsapp.verificarTelefono')}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder={t('preferenciasNotificacion.whatsapp.telefonoPlaceholder')}
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleEnviarCodigo}
                disabled={!telefono.trim() || enviandoCodigo}
                className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {enviandoCodigo && <Loader2 size={16} className="animate-spin" />}
                {t('preferenciasNotificacion.whatsapp.enviarCodigo')}
              </button>
            </div>
          </div>
        )}

        {/* Ingreso de codigo OTP */}
        {codigoEnviado && (
          <div className="bg-background rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Shield size={16} />
              <span>{t('preferenciasNotificacion.whatsapp.ingresarCodigo')}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder={t('preferenciasNotificacion.whatsapp.codigoPlaceholder')}
                maxLength={8}
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleVerificar}
                disabled={!codigo.trim() || verificando}
                className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {verificando && <Loader2 size={16} className="animate-spin" />}
                {t('preferenciasNotificacion.whatsapp.verificar')}
              </button>
            </div>
          </div>
        )}

        {/* Telefono verificado */}
        {preferencias.telefonoVerificado && preferencias.telefonoWhatsApp && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check size={16} />
            <span>
              {t('preferenciasNotificacion.whatsapp.verificadoComo', {
                telefono: preferencias.telefonoWhatsApp,
              })}
            </span>
          </div>
        )}

        {/* Categorias WhatsApp */}
        {preferencias.whatsAppHabilitado && preferencias.telefonoVerificado && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-text">
              {t('preferenciasNotificacion.whatsapp.categoriasTitle')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map(({ value, labelKey }) => {
                const activa =
                  preferencias.categoriasWhatsApp === null ||
                  preferencias.categoriasWhatsApp.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => handleToggleCategoria(value)}
                    disabled={guardando}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      activa
                        ? 'border-green-500 bg-green-500/10 text-green-700'
                        : 'border-border bg-background text-text-muted'
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
