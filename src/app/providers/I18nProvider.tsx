/**
 * Provider de i18n que sincroniza el idioma con:
 * 1. Override del usuario (localStorage) - máxima prioridad
 * 2. Culture del backend (si no hay override)
 * 
 * La detección automática del navegador se maneja en config.ts con LanguageDetector,
 * pero este provider tiene prioridad si hay preferencias del backend.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '@/hooks/useLocalization';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { i18n } = useTranslation();
  const { culture, isReady } = useLocalization();

  // Sincronizar idioma cuando las preferencias del backend estén listas
  useEffect(() => {
    if (!isReady) return;

    // Prioridad 1: Override del usuario (localStorage)
    // Si el usuario ya eligió un idioma manualmente, no lo sobrescribimos con el backend
    const storedLanguage = localStorage.getItem('tracauto-user-language');
    
    if (storedLanguage && (storedLanguage === 'es' || storedLanguage === 'en')) {
      // Usuario tiene override explícito, respetarlo
      if (i18n.language !== storedLanguage) {
        i18n.changeLanguage(storedLanguage);
      }
      return;
    }

    // Prioridad 2: Culture del backend (solo si no hay override del usuario)
    // El LanguageDetector ya detectó el navegador, pero el backend puede tener preferencia
    if (culture) {
      const backendLanguage = culture.split('-')[0] || 'es';
      const validLanguage = backendLanguage === 'en' ? 'en' : 'es';
      
      // Solo cambiar si es diferente al actual
      if (i18n.language !== validLanguage) {
        i18n.changeLanguage(validLanguage);
      }
    }
  }, [culture, isReady, i18n]);

  return <>{children}</>;
}

