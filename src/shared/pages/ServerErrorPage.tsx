/**
 * Página 500 - Error del servidor
 * Se muestra cuando ocurre un error grave del servidor
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { ServerCrash, Home, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export function ServerErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Obtener traceId del state de navegación si existe
  const traceId = (location.state as { traceId?: string })?.traceId || generateErrorId();

  function generateErrorId(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(traceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.log('Error ID:', traceId);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Ilustración */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-error/10 flex items-center justify-center">
            <ServerCrash className="w-16 h-16 text-error" />
          </div>
        </div>

        {/* Código de error */}
        <h1 className="text-7xl font-bold text-error mb-4">500</h1>

        {/* Título y descripción */}
        <h2 className="text-2xl font-semibold text-text mb-2">
          {t('errorPages.serverError.title', 'Error del servidor')}
        </h2>
        <p className="text-text-muted mb-6">
          {t('errorPages.serverError.message', 'Ocurrió un error inesperado. Nuestro equipo ya fue notificado.')}
        </p>

        {/* ID de referencia */}
        <div className="mb-8 p-4 bg-surface rounded-lg border border-border">
          <p className="text-xs text-text-muted mb-1">
            {t('errorPages.referenceId', 'ID de referencia')}
          </p>
          <div className="flex items-center justify-center gap-2">
            <code className="text-lg font-mono text-text font-semibold">
              {traceId}
            </code>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-background transition-colors"
              title={t('common.copy', 'Copiar')}
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-text-muted" />
              )}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {t('errorPages.referenceHint', 'Usá este código si contactás a soporte')}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.retry', 'Reintentar')}
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t('common.goHome', 'Ir al Inicio')}
          </Button>
        </div>
      </div>
    </div>
  );
}
