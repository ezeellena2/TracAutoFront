/**
 * Configuración de i18next para internacionalización
 * 
 * Prioridad de detección de idioma:
 * 1. localStorage (override del usuario)
 * 2. navigator.language (detección automática del navegador)
 * 3. Fallback: 'es'
 * 
 * Nota: El I18nProvider puede sobreescribir con culture del backend si no hay override del usuario.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import es from './locales/es.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, // React ya escapa valores
    },
    react: {
      useSuspense: false, // No usar Suspense para evitar problemas
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'tracauto-user-language',
      caches: ['localStorage'],
    },
  });

export default i18n;

