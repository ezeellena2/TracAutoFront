import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/shared/ui';
import { useSidebarStore } from '@/store';

export function MainLayout() {
  const { isCollapsed } = useSidebarStore();
  
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
