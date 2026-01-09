/**
 * Componente que muestra un countdown cuando el usuario
 * recibe un error 429 (Too Many Requests).
 * 
 * Uso:
 * <RateLimitCountdown 
 *   seconds={30} 
 *   onComplete={() => setCanRetry(true)} 
 * />
 */

import { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RateLimitCountdownProps {
  /** Segundos restantes hasta poder reintentar */
  seconds: number;
  /** Callback cuando el countdown termina */
  onComplete?: () => void;
  /** Callback para cerrar manualmente */
  onDismiss?: () => void;
  /** Mensaje personalizado */
  message?: string;
}

export function RateLimitCountdown({ 
  seconds: initialSeconds, 
  onComplete,
  onDismiss,
  message 
}: RateLimitCountdownProps) {
  const { t } = useTranslation();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (seconds <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onComplete]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || seconds <= 0) {
    return null;
  }

  // Calcular progreso para la barra
  const progress = ((initialSeconds - seconds) / initialSeconds) * 100;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-2">
      <div className="bg-warning/10 border border-warning rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 mt-0.5 flex-shrink-0 text-warning" />
          <div className="flex-1">
            <p className="font-semibold text-warning">
              {t('rateLimit.title', 'Demasiadas solicitudes')}
            </p>
            <p className="text-sm text-text-muted mt-1">
              {message || t('rateLimit.message', { 
                seconds, 
                defaultValue: `Por favor esperá ${seconds} segundos antes de intentar nuevamente.` 
              })}
            </p>
            
            {/* Barra de progreso */}
            <div className="mt-3 h-2 bg-warning/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-warning transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Tiempo restante */}
            <p className="text-xs text-text-muted mt-2 text-right">
              {t('rateLimit.retryIn', { seconds, defaultValue: `Reintentar en ${seconds}s` })}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-warning/20 rounded transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-warning" />
          </button>
        </div>
      </div>
    </div>
  );
}
