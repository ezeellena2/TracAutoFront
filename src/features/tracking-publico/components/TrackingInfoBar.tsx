import { useTranslation } from 'react-i18next';
import { TipoAccesoTracking } from '@/features/tracking-links/types';

interface TrackingInfoBarProps {
  vehiculoNombre?: string | null;
  velocidad?: number | null;
  fechaUltimaPosicion: string;
  tipoAcceso: TipoAccesoTracking;
  organizacionNombre?: string | null;
}

export function TrackingInfoBar({
  vehiculoNombre,
  velocidad,
  fechaUltimaPosicion,
  tipoAcceso,
  organizacionNombre,
}: TrackingInfoBarProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 text-sm">
          {tipoAcceso === TipoAccesoTracking.Completo && vehiculoNombre && (
            <div>
              <span className="text-gray-500">{t('trackingPublico.vehiculo')}:</span>{' '}
              <span className="font-medium text-gray-800">{vehiculoNombre}</span>
            </div>
          )}
          {velocidad != null && (
            <div>
              <span className="text-gray-500">{t('trackingPublico.velocidad')}:</span>{' '}
              <span className="font-medium text-gray-800">
                {Math.round(velocidad)} {t('trackingPublico.kmh')}
              </span>
            </div>
          )}
          <div>
            <span className="text-gray-500">{t('trackingPublico.ultimaActualizacion')}:</span>{' '}
            <span className="font-medium text-gray-800">
              {new Date(fechaUltimaPosicion).toLocaleTimeString()}
            </span>
          </div>
        </div>
        {tipoAcceso === TipoAccesoTracking.Completo && organizacionNombre && (
          <p className="text-xs text-gray-400">
            {t('trackingPublico.poweredBy')} — {organizacionNombre}
          </p>
        )}
      </div>
    </div>
  );
}
