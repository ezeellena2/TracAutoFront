import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '@/shared/ui';
import { HeaderAlquiler } from './HeaderAlquiler';
import { FooterAlquiler } from './FooterAlquiler';

export function AlquilerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeaderAlquiler />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <FooterAlquiler />
    </div>
  );
}
