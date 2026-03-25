import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HeaderMarketplace() {
  const { t } = useTranslation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="container-app">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-primary">
            <Car className="h-8 w-8" />
            <span className="hidden text-xl font-bold sm:inline">TracAuto Marketplace</span>
            <span className="text-xl font-bold sm:hidden">Marketplace</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/" className="text-text-muted transition-colors hover:text-primary">
              {t('catalogoMarketplace.catalogo')}
            </Link>
          </nav>

          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="p-2 text-text-muted hover:text-text md:hidden"
            aria-label={t(menuAbierto ? 'common.closeMenu' : 'common.openMenu')}
          >
            {menuAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuAbierto && (
          <nav className="animate-slide-in border-t border-border py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-text-muted transition-colors hover:text-primary"
                onClick={() => setMenuAbierto(false)}
              >
                {t('catalogoMarketplace.catalogo')}
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
