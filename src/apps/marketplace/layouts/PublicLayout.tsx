import { Outlet } from 'react-router-dom';
import { ErrorBoundary } from '@/shared/ui';
import { HeaderMarketplace } from './Header';
import { FooterMarketplace } from './Footer';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeaderMarketplace />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <FooterMarketplace />
    </div>
  );
}
