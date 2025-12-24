/**
 * Componente para cambiar el idioma de la aplicación
 * Muestra selector ES/EN y persiste la preferencia en localStorage
 */

import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalizationStore } from '@/store/localization.store';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { setUserLanguage } = useLocalizationStore();

  const currentLanguage = i18n.language || 'es';
  const isSpanish = currentLanguage === 'es';

  const handleLanguageChange = () => {
    const newLanguage = isSpanish ? 'en' : 'es';
    setUserLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  return (
    <button
      onClick={handleLanguageChange}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background transition-colors text-text"
      title={isSpanish ? 'Cambiar a inglés' : 'Switch to Spanish'}
    >
      <Languages size={16} />
      <span className="text-sm font-medium">{isSpanish ? 'ES' : 'EN'}</span>
    </button>
  );
}

