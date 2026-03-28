import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { PageLoader } from '@/shared/ui/PageLoader';
import './index.css';

const AppComponent = lazy(() => import('./apps/b2b/B2BApp'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <AppComponent />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
);
