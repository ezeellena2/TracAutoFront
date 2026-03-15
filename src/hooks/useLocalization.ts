import { useEffect } from 'react';
import { useLocalizationStore } from '@/store/localization.store';
import { useAuthStore } from '@/store/auth.store';

/**
 * Hook para acceder a las preferencias de localización de la organización.
 * 
 * Carga las preferencias automáticamente si no están cargadas.
 * Las preferencias se mantienen en memoria durante la sesión.
 * 
 * @returns Preferencias de localización y estado de carga
 */
export function useLocalization() {
  const store = useLocalizationStore();
  const { isAuthenticated } = useAuthStore();

  // Cargar preferencias si no están cargadas, no hay carga en progreso y estamos autenticados
  // No bloqueamos por falta de token; el apiClient se encargará del auto-refresh tras un F5.
  useEffect(() => {
    if (isAuthenticated && !store.preferences && !store.isLoading && !store.error) {
      store.loadPreferences();
    }
  }, [isAuthenticated, store.preferences, store.isLoading, store.error, store]);

  return {
    timeZoneId: store.preferences?.timeZoneId || Intl.DateTimeFormat().resolvedOptions().timeZone,
    culture: store.preferences?.culture ?? 'es-AR',
    measurementSystem: store.preferences?.measurementSystem ?? 0, // Metric
    country: store.preferences?.country ?? null,
    isLoading: store.isLoading,
    error: store.error,
    isReady: store.preferences !== null,
  };
}

