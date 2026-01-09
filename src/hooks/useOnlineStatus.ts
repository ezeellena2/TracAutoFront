/**
 * Hook para detectar el estado de conexión a internet.
 * Escucha los eventos online/offline del navegador.
 */

import { useState, useEffect, useCallback } from 'react';

interface UseOnlineStatusReturn {
  /** Indica si hay conexión a internet */
  isOnline: boolean;
  /** Indica si estamos en proceso de reconexión (transición de offline a online) */
  isReconnecting: boolean;
  /** Timestamp de la última vez que se perdió la conexión */
  lastOfflineAt: Date | null;
}

export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastOfflineAt, setLastOfflineAt] = useState<Date | null>(null);

  const handleOnline = useCallback(() => {
    setIsReconnecting(true);
    // Pequeño delay para mostrar el estado de "reconectando"
    setTimeout(() => {
      setIsOnline(true);
      setIsReconnecting(false);
    }, 1000);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setLastOfflineAt(new Date());
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    isReconnecting,
    lastOfflineAt,
  };
}
