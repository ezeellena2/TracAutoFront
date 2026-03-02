import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { detectAppMode } from '@/config/appMode';
import { PageLoader } from '@/shared/ui';
import './index.css';

const mode = detectAppMode();

const AppComponent = lazy(() => {
  switch (mode) {
    case 'marketplace': return import('./apps/marketplace/MarketplaceApp');
    case 'alquiler':    return import('./apps/alquiler/AlquilerApp');
    default:            return import('./apps/b2b/B2BApp');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<PageLoader />}>
      <AppComponent />
    </Suspense>
  </StrictMode>,
);
