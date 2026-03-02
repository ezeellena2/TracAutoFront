import { Outlet, Link } from 'react-router-dom';
import { Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/shared/ui';

export function AlquilerLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header alquiler */}
      <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Car size={24} className="text-white" />
          </div>
          <span className="font-bold text-lg text-text">TracAuto Alquiler</span>
        </Link>
      </header>

      {/* Contenido */}
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-6 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} TracAuto. {t('common.allRightsReserved', 'Todos los derechos reservados.')}
          </p>
        </div>
      </footer>
    </div>
  );
}
