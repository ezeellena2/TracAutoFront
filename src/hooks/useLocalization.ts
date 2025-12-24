import { useEffect } from 'react';
import { useLocalizationStore } from '@/store/localization.store';

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

  // Cargar preferencias si no están cargadas y no hay carga en progreso
  useEffect(() => {
    if (!store.preferences && !store.isLoading && !store.error) {
      store.loadPreferences();
    }
  }, [store.preferences, store.isLoading, store.error, store]);

  return {
    timeZoneId: store.preferences?.timeZoneId ?? 'UTC',
    culture: store.preferences?.culture ?? 'es-AR',
    measurementSystem: store.preferences?.measurementSystem ?? 0, // Metric
    country: store.preferences?.country ?? null,
    isLoading: store.isLoading,
    error: store.error,
    isReady: store.preferences !== null,
  };
}

