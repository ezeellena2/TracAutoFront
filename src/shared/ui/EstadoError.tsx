import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

interface EstadoErrorProps {
  mensaje?: string;
  onReintentar?: () => void;
}

export function EstadoError({
  mensaje,
  onReintentar,
}: EstadoErrorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-error mb-4">
        <AlertTriangle className="w-16 h-16" />
      </div>
      <h3 className="text-lg font-semibold text-text mb-2">{t('common.estadoError.titulo')}</h3>
      <p className="text-text-muted max-w-md mb-6">{mensaje ?? t('common.estadoError.mensajeDefault')}</p>
      {onReintentar && (
        <Button variant="outline" onClick={onReintentar}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('common.estadoError.reintentar')}
        </Button>
      )}
    </div>
  );
}
