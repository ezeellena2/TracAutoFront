import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { PreferenciasNotificacionPanel } from '../components';

export function PreferenciasNotificacionPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Bell className="text-primary" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">
            {t('preferenciasNotificacion.titulo')}
          </h1>
          <p className="text-sm text-text-muted">
            {t('preferenciasNotificacion.subtitulo')}
          </p>
        </div>
      </div>

      <PreferenciasNotificacionPanel />
    </div>
  );
}
