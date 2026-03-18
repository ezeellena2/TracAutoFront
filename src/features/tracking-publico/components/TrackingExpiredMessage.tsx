import { useTranslation } from 'react-i18next';

export function TrackingExpiredMessage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-2xl">!</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">{t('trackingPublico.error')}</h1>
        <p className="text-gray-600">{t('trackingPublico.linkInvalido')}</p>
      </div>
    </div>
  );
}
