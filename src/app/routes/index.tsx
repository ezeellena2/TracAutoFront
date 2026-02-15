import { lazy, Suspense } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '@/app/layouts';
import { ProtectedRoute } from './ProtectedRoute';
import { PageLoader } from '@/shared/ui';
// Lazy-loaded features para mejor code-splitting
// Ref: https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegistroPage = lazy(() => import('@/features/auth/pages/RegistroPage').then(m => ({ default: m.RegistroPage })));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const VehiclesPage = lazy(() => import('@/features/vehicles/pages/VehiclesPage').then(m => ({ default: m.VehiclesPage })));
const DevicesPage = lazy(() => import('@/features/devices/pages/DevicesPage').then(m => ({ default: m.DevicesPage })));
const EventsPage = lazy(() => import('@/features/events/pages/EventsPage').then(m => ({ default: m.EventsPage })));
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const DriversPage = lazy(() => import('@/features/drivers/pages/DriversPage').then(m => ({ default: m.DriversPage })));
const AcceptInvitationPage = lazy(() => import('@/features/invitations/pages/AcceptInvitationPage').then(m => ({ default: m.AcceptInvitationPage })));
const BrandingPage = lazy(() => import('@/features/organization/pages/BrandingPage').then(m => ({ default: m.BrandingPage })));
const RelacionesOrganizacionPage = lazy(() => import('@/features/organization/pages/RelacionesOrganizacionPage').then(m => ({ default: m.RelacionesOrganizacionPage })));
const SolicitudesCambioPage = lazy(() => import('@/features/organization/pages/SolicitudesCambioPage').then(m => ({ default: m.SolicitudesCambioPage })));
const TraccarMapPage = lazy(() => import('@/features/traccar-map/pages/TraccarMapPage').then(m => ({ default: m.TraccarMapPage })));
const ReplayPage = lazy(() => import('@/features/replay/pages/ReplayPage').then(m => ({ default: m.ReplayPage })));
const MarketplacePage = lazy(() => import('@/features/marketplace/pages/MarketplacePage').then(m => ({ default: m.MarketplacePage })));
const GeofencesPage = lazy(() => import('@/features/geofences/pages/GeofencesPage').then(m => ({ default: m.GeofencesPage })));
const GeofenceEditorPage = lazy(() => import('@/features/geofences/pages/GeofenceEditorPage').then(m => ({ default: m.GeofenceEditorPage })));
const GeofenceMapViewPage = lazy(() => import('@/features/geofences/pages/GeofenceMapViewPage').then(m => ({ default: m.GeofenceMapViewPage })));
const ImportsPage = lazy(() => import('@/features/imports/pages/ImportsPage').then(m => ({ default: m.ImportsPage })));

// Error pages - se cargan eager porque son pequeñas y críticas
import { NotFoundPage, ServerErrorPage } from '@/shared/pages';

// Wrapper con Suspense para componentes lazy
const withSuspense = (Component: LazyExoticComponent<ComponentType>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/registro',
    element: withSuspense(RegistroPage),
  },
  {
    path: '/invitacion/:token',
    element: withSuspense(AcceptInvitationPage),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: withSuspense(DashboardPage),
      },
      {
        path: 'vehiculos',
        element: withSuspense(VehiclesPage),
      },
      {
        path: 'dispositivos',
        element: withSuspense(DevicesPage),
      },
      {
        path: 'eventos',
        element: withSuspense(EventsPage),
      },
      {
        path: 'usuarios',
        element: withSuspense(UsersPage),
      },
      {
        path: 'conductores',
        element: withSuspense(DriversPage),
      },
      {
        path: 'marketplace',
        element: withSuspense(MarketplacePage),
      },
      {
        path: 'mapa',
        element: withSuspense(TraccarMapPage),
      },
      {
        path: 'replay',
        element: withSuspense(ReplayPage),
      },
      {
        path: 'configuracion/empresa/apariencia',
        element: withSuspense(BrandingPage),
      },
      {
        path: 'configuracion/empresa/relaciones',
        element: withSuspense(RelacionesOrganizacionPage),
      },
      {
        path: 'configuracion/empresa/solicitudes-cambio',
        element: withSuspense(SolicitudesCambioPage),
      },
      {
        path: 'geozonas',
        element: withSuspense(GeofencesPage),
      },
      {
        path: 'geozonas/mapa',
        element: withSuspense(GeofenceMapViewPage),
      },
      {
        path: 'geozonas/crear',
        element: withSuspense(GeofenceEditorPage),
      },
      {
        path: 'geozonas/:id/editar',
        element: withSuspense(GeofenceEditorPage),
      },
      {
        path: 'importaciones',
        element: withSuspense(ImportsPage),
      },
    ],
  },
  // Error pages
  {
    path: '/error',
    element: <ServerErrorPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
