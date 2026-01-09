/**
 * Indicador de estado de conexión.
 * Muestra un banner cuando el usuario está offline.
 */

import { WifiOff, Wifi, RefreshCw, X } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export function OfflineIndicator() {
  const { isOnline, isReconnecting } = useOnlineStatus();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Resetear dismissed cuando vuelve a estar offline
  useEffect(() => {
    if (!isOnline) {
      setDismissed(false);
      setWasOffline(true);
    }
  }, [isOnline]);

  // Mostrar mensaje de reconexión exitosa brevemente
  useEffect(() => {
    if (isOnline && wasOffline && !isReconnecting) {
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, isReconnecting]);

  // No mostrar nada si está online y nunca estuvo offline, o si se dismisseó
  if ((isOnline && !wasOffline && !isReconnecting) || dismissed) {
    return null;
  }

  // Reconectando
  if (isReconnecting) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-2">
        <div className="bg-warning/10 border border-warning text-warning-foreground rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-warning" />
            <span className="font-medium">
              {t('common.reconnecting', 'Reconectando...')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Reconexión exitosa
  if (isOnline && wasOffline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-2">
        <div className="bg-success/10 border border-success text-success rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5" />
            <span className="font-medium">
              {t('common.online', 'Conectado')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Offline
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-2">
      <div className="bg-error/10 border border-error text-error rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <WifiOff className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">
              {t('common.offline', 'Sin conexión')}
            </p>
            <p className="text-sm opacity-90 mt-1">
              {t('offline.message', 'No hay conexión a internet. Algunas funciones no están disponibles.')}
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-error/20 rounded transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
