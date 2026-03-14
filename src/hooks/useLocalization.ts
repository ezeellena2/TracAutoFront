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
  const { isAuthenticated, token } = useAuthStore();

  // Cargar preferencias si no están cargadas, no hay carga en progreso y estamos autenticados
  // No intentamos cargar si no hay token para evitar que el interceptor fuerce un redirect a /login en rutas públicas
  useEffect(() => {
    if (isAuthenticated && token && !store.preferences && !store.isLoading && !store.error) {
      store.loadPreferences();
    }
  }, [isAuthenticated, token, store.preferences, store.isLoading, store.error, store]);

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

