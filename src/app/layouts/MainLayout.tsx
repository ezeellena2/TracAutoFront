import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer, ErrorBoundary, ErrorReportModal } from '@/shared/ui';
import { useSidebarStore, useAuthStore, useLocalizationStore, useModoSolicitudStore } from '@/store';
import { useModoSolicitudDetection } from '@/hooks';
import { SolicitudCambioModal } from '@/features/solicitudes-cambio';
import { NotificationProvider } from '@/features/notifications';

export function MainLayout() {
  const location = useLocation();
  const { isCollapsed, openMobile } = useSidebarStore();
  const { isAuthenticated } = useAuthStore();
  const { preferences, loadPreferences, isLoading } = useLocalizationStore();
  const { selectedContext, clearSelection } = useModoSolicitudStore();

  useModoSolicitudDetection();

  // Cargar preferencias de localización una vez post-auth
  useEffect(() => {
    if (isAuthenticated && !preferences && !isLoading) {
      loadPreferences();
    }
  }, [isAuthenticated, preferences, isLoading, loadPreferences]);

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        {/* Content wrapper - no margin on mobile, sidebar margin on desktop */}
        <div className={`transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          {/* Mobile header with hamburger */}
          <div className="md:hidden flex items-center gap-3 p-4 border-b border-border bg-surface">
            <button
              onClick={openMobile}
              className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
              aria-label="Abrir menú"
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-lg text-text">TracAuto</span>
          </div>
          {/* Desktop header */}
          <div className="hidden md:block">
            <Header />
          </div>
          <main className="p-4 md:p-6">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
        {/* Notificaciones Toast globales */}
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
    </NotificationProvider>
  );
}
