import { useTranslation } from 'react-i18next';

interface TrackingConnectionStatusProps {
  connectionState: string;
}

export function TrackingConnectionStatus({ connectionState }: TrackingConnectionStatusProps) {
  const { t } = useTranslation();

  const dotColor =
    connectionState === 'connected'
      ? 'bg-green-500 animate-pulse'
      : connectionState === 'reconnecting' || connectionState === 'connecting'
        ? 'bg-yellow-500 animate-pulse'
        : 'bg-blue-500';

  const label =
    connectionState === 'connected'
      ? t('trackingPublico.titulo')
      : connectionState === 'reconnecting'
        ? t('trackingPublico.reconectando')
        : t('trackingPublico.titulo');

  return (
    <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
      <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </div>
  );
}
