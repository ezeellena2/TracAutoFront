import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalizationStore } from '@/store/localization.store';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
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
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-text transition-colors hover:bg-background"
      title={t(isSpanish ? 'header.switchToEnglish' : 'header.switchToSpanish')}
    >
      <Languages size={16} />
      <span className="text-sm font-medium">{isSpanish ? 'ES' : 'EN'}</span>
    </button>
  );
}
