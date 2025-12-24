/**
 * Provider de i18n que inicializa con culture del backend
 * y permite override del usuario desde localStorage
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

  // Inicializar idioma cuando las preferencias estén listas
  useEffect(() => {
    if (!isReady) return;

    // Resolución: userLanguage (store/localStorage) → culture (backend) → 'es' (fallback)
    const storedLanguage = localStorage.getItem('tracauto-user-language');
    
    if (storedLanguage && (storedLanguage === 'es' || storedLanguage === 'en')) {
      // Usuario tiene override, usarlo
      if (i18n.language !== storedLanguage) {
        i18n.changeLanguage(storedLanguage);
      }
    } else if (culture) {
      // Usar culture del backend (extraer idioma de culture code)
      const backendLanguage = culture.split('-')[0] || 'es';
      const validLanguage = backendLanguage === 'en' ? 'en' : 'es';
      
      if (i18n.language !== validLanguage) {
        i18n.changeLanguage(validLanguage);
      }
    }
  }, [culture, isReady, i18n]);

  return <>{children}</>;
}

