import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Smartphone, MapPin, History, Building2, Car, Phone, Package, AlertCircle } from 'lucide-react';
import { dispositivosApi } from '@/services/endpoints';
import type { DispositivoQrPublicoDto } from '@/shared/types/api';
import { stockStatusLabels, stockStatusColors } from '../utils/stockStatus';


export function DevicePublicPage() {
  const { codigoQr } = useParams<{ codigoQr: string }>();
  const { t } = useTranslation();
  const [device, setDevice] = useState<DispositivoQrPublicoDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!codigoQr) return;

    const loadDevice = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await dispositivosApi.getDispositivoPublico(codigoQr);
        setDevice(result);
      } catch {
        setError(t('devices.public.notFound'));
      } finally {
        setIsLoading(false);
      }
    };

    void loadDevice();
  }, [codigoQr, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 text-center shadow-2xl">
          <AlertCircle size={56} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">
            {t('devices.public.notFoundTitle')}
          </h1>
          <p className="text-slate-400 text-sm">
            {error ?? t('devices.public.notFound')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <Smartphone size={16} className="text-blue-400" />
            <span className="text-sm font-medium text-blue-400">TracAuto GPS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {device.alias || `IMEI: ${device.imei}`}
          </h1>
          {device.organizacionNombre && (
            <p className="text-slate-400 text-sm mt-1 flex items-center justify-center gap-1">
              <Building2 size={14} />
              {device.organizacionNombre}
            </p>
          )}
        </div>

        {/* Main card */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
          {/* Stock status bar */}
          <div className={`px-4 py-2.5 ${stockStatusColors[device.estadoStock]} flex items-center gap-2`}>
            <Package size={16} className="text-white" />
            <span className="text-sm font-medium text-white">
              {t(stockStatusLabels[device.estadoStock])}
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* IMEI */}
            <InfoRow icon={<Smartphone size={16} />} label="IMEI" value={device.imei} mono />

            {/* Phone */}
            {device.numeroTelefono && (
              <InfoRow icon={<Phone size={16} />} label={t('devices.public.phone')} value={device.numeroTelefono} />
            )}

            {/* Model */}
            {device.modeloDispositivo && (
              <InfoRow icon={<Package size={16} />} label={t('devices.public.model')} value={device.modeloDispositivo} />
            )}

            {/* Provider */}
            {device.proveedor && (
              <InfoRow icon={<Building2 size={16} />} label={t('devices.public.provider')} value={device.proveedor} />
            )}

            {/* Vehicle */}
            {device.vehiculoAsignado && (
              <InfoRow
                icon={<Car size={16} />}
                label={t('devices.public.vehicle')}
                value={`${device.vehiculoPatente ? `[${device.vehiculoPatente}] ` : ''}${device.vehiculoAsignado}`}
              />
            )}
          </div>
        </div>

        {/* Deep links */}
        <div className="grid grid-cols-2 gap-3">
          {device.urlMapa && (
            <Link
              to={device.urlMapa}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-medium"
            >
              <MapPin size={18} />
              {t('devices.public.viewMap')}
            </Link>
          )}
          {device.urlHistorial && (
            <Link
              to={device.urlHistorial}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400 hover:bg-purple-500/20 transition-all text-sm font-medium"
            >
              <History size={18} />
              {t('devices.public.viewHistory')}
            </Link>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          {t('devices.public.poweredBy')}
        </p>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-slate-400 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-sm text-white truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
