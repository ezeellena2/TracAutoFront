/**
 * Configuración de i18next para internacionalización
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';

// Obtener idioma desde localStorage o usar fallback
const getStoredLanguage = (): string => {
  const stored = localStorage.getItem('tracauto-user-language');
  if (stored && (stored === 'es' || stored === 'en')) {
    return stored;
  }
  return 'es'; // Fallback
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // React ya escapa valores
    },
    react: {
      useSuspense: false, // No usar Suspense para evitar problemas
    },
  });

export default i18n;

