import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCurrentOrganizationPreferences } from '@/services/endpoints/organizaciones.api';

/**
 * Preferencias de localización efectivas
 */
export interface LocalizationPreferences {
  timeZoneId: string;
  culture: string;
  measurementSystem: number; // 0=Metric, 1=Imperial
  country: number | null;
}

interface LocalizationState {
  /**
   * Preferencias de localización efectivas.
   * Cargadas una vez por sesión desde el backend.
   */
  preferences: LocalizationPreferences | null;
  
  /**
   * Indica si las preferencias están siendo cargadas
   */
  isLoading: boolean;
  
  /**
   * Error al cargar preferencias (si existe)
   */
  error: string | null;

  /**
   * Idioma del usuario (override de culture del backend).
   * 'es' | 'en' | null
   * Persistido en localStorage.
   */
  userLanguage: string | null;

  // Actions
  setPreferences: (prefs: LocalizationPreferences) => void;
  loadPreferences: () => Promise<void>;
  clearPreferences: () => void;
  setUserLanguage: (language: string | null) => void;
}

/**
 * Store de localización.
 * Mantiene las preferencias de timezone, culture y sistema de medición
 * de la organización actual en memoria (no persistido).
 * userLanguage se persiste en localStorage.
 */
export const useLocalizationStore = create<LocalizationState>()(
  persist(
    (set) => ({
      preferences: null,
      isLoading: false,
      error: null,
      userLanguage: null,

      setPreferences: (prefs) => set({ preferences: prefs, error: null }),

      loadPreferences: async () => {
        set({ isLoading: true, error: null });
        try {
          const prefs = await getCurrentOrganizationPreferences();
          set({ 
            preferences: {
              timeZoneId: prefs.timeZoneId,
              culture: prefs.culture,
              measurementSystem: prefs.measurementSystem,
              country: prefs.country,
            },
            isLoading: false,
            error: null,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error al cargar preferencias';
          set({ 
            error: message,
            isLoading: false,
            // Mantener preferencias anteriores si hay error
          });
        }
      },

      clearPreferences: () => set({ preferences: null, error: null }),

      setUserLanguage: (language) => {
        set({ userLanguage: language });
        // Actualizar localStorage directamente para sincronización inmediata
        if (language) {
          localStorage.setItem('tracauto-user-language', language);
        } else {
          localStorage.removeItem('tracauto-user-language');
        }
      },
    }),
    {
      name: 'tracauto-localization',
      partialize: (state) => ({
        userLanguage: state.userLanguage,
      }),
    }
  )
);

