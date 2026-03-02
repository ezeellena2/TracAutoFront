import { Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function FooterMarketplace() {
  const { t } = useTranslation();
  const anioActual = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="container-app py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-text-muted">
            <Car className="w-5 h-5" />
            <span className="font-semibold">TracAuto Marketplace</span>
          </div>

          <p className="text-sm text-text-muted">
            © {anioActual} TracAuto. {t('catalogoMarketplace.derechosReservados')}
          </p>
        </div>
      </div>
    </footer>
  );
}
