import { useTranslation } from 'react-i18next';

export function TrackingLoadingSkeleton() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">{t('trackingPublico.cargando')}</p>
      </div>
    </div>
  );
}
