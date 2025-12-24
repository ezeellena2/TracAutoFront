import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/shared/ui';
import { useSidebarStore, useAuthStore, useLocalizationStore } from '@/store';

export function MainLayout() {
  const { isCollapsed } = useSidebarStore();
  const { isAuthenticated } = useAuthStore();
  const { preferences, loadPreferences, isLoading } = useLocalizationStore();

  // Cargar preferencias de localización una vez post-auth
  useEffect(() => {
    if (isAuthenticated && !preferences && !isLoading) {
      loadPreferences();
    }
  }, [isAuthenticated, preferences, isLoading, loadPreferences]);
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
      {/* Notificaciones Toast globales */}
      <ToastContainer />
    </div>
  );
}
