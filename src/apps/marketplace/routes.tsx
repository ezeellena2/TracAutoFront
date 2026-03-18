import { lazy, Suspense } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PublicLayout } from '@/apps/marketplace/layouts';
import { PageLoader } from '@/shared/ui';
import { NotFoundPage } from '@/shared/pages';

const CatalogoPage = lazy(() =>
  import('@/features/catalogo-marketplace/pages/CatalogoPage').then(m => ({ default: m.CatalogoPage }))
);
const DetallePage = lazy(() =>
  import('@/features/catalogo-marketplace/pages/DetallePage').then(m => ({ default: m.DetallePage }))
);
const FavoritosPage = lazy(() =>
  import('@/features/catalogo-marketplace/pages/FavoritosPage').then(m => ({ default: m.FavoritosPage }))
);

function SuspensePage({ Component }: { Component: LazyExoticComponent<ComponentType> }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <SuspensePage Component={CatalogoPage} />,
      },
      {
        path: 'vehiculo/:id',
        element: <SuspensePage Component={DetallePage} />,
      },
      {
        path: 'favoritos',
        element: <SuspensePage Component={FavoritosPage} />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function MarketplaceRouter() {
  return <RouterProvider router={router} />;
}
