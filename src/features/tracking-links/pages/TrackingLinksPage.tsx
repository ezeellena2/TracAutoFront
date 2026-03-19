import { useTranslation } from 'react-i18next';
import { TrackingLinksPanel } from '../components/TrackingLinksPanel';

export function TrackingLinksPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header propio de la página standalone */}
      <div>
        <h1 className="text-2xl font-bold text-text">{t('trackingLinks.titulo')}</h1>
        <p className="text-sm text-text-muted mt-1">{t('trackingLinks.subtitulo')}</p>
      </div>

      {/* Panel reutilizable — sin filtros = muestra TODOS los links de la org */}
      <TrackingLinksPanel compact />
    </div>
  );
}
