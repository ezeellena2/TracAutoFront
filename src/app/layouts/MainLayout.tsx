import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer, ErrorBoundary, ErrorReportModal } from '@/shared/ui';
import { useAuthStore } from '@/store/auth.store';
import { useLocalizationStore } from '@/store/localization.store';
import { useModoSolicitudStore } from '@/store/modoSolicitud.store';
import { useSidebarStore } from '@/store/sidebar.store';
import { useModoSolicitudDetection } from '@/hooks';
import { SolicitudCambioModal } from '@/features/solicitudes-cambio';

export function MainLayout() {
  const location = useLocation();
  const { t } = useTranslation();
  const { isCollapsed, openMobile } = useSidebarStore();
  const { isAuthenticated } = useAuthStore();
  const { preferences, loadPreferences, isLoading } = useLocalizationStore();
  const { selectedContext, clearSelection } = useModoSolicitudStore();

  useModoSolicitudDetection();

  // Cargar preferencias de localizacion una vez post-auth
  useEffect(() => {
    if (isAuthenticated && !preferences && !isLoading) {
      loadPreferences();
    }
  }, [isAuthenticated, preferences, isLoading, loadPreferences]);

  return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Sidebar />
        {/* Content wrapper - no margin on mobile, sidebar margin on desktop */}
        <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          {/* Mobile header with hamburger */}
          <div className="md:hidden flex items-center gap-3 p-4 border-b border-border bg-surface flex-shrink-0">
            <button
              onClick={openMobile}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
              aria-label={t('common.openMenu')}
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-lg text-text">{t('auth.title')}</span>
          </div>
          {/* Desktop header */}
          <div className="hidden md:block flex-shrink-0">
            <Header />
          </div>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
        {/* Toasts globales */}
        <ToastContainer />
        {/* Modal global de reporte de errores */}
        <ErrorReportModal />

        {/* Modal chat Modo Solicitud (click en elemento seleccionable) */}
        <SolicitudCambioModal
          isOpen={!!selectedContext}
          onClose={clearSelection}
          onEnviadoAJira={clearSelection}
          contexto={selectedContext}
        />
      </div>
  );
}

