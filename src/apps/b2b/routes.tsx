import { lazy, Suspense } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '@/apps/b2b/layouts';
import { ProtectedRoute } from '@/app/routes/ProtectedRoute';
import { PageLoader } from '@/shared/ui';
import { NotFoundPage, ServerErrorPage } from '@/shared/pages';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegistroPage = lazy(() => import('@/features/auth/pages/RegistroPage').then(m => ({ default: m.RegistroPage })));
const ActivacionCuentaPage = lazy(() => import('@/features/auth/pages/ActivacionCuentaPage').then(m => ({ default: m.ActivacionCuentaPage })));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const VehiclesPage = lazy(() => import('@/features/vehicles/pages/VehiclesPage').then(m => ({ default: m.VehiclesPage })));
const DevicesPage = lazy(() => import('@/features/devices/pages/DevicesPage').then(m => ({ default: m.DevicesPage })));
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const DriversPage = lazy(() => import('@/features/drivers/pages/DriversPage').then(m => ({ default: m.DriversPage })));
const AcceptInvitationPage = lazy(() => import('@/features/invitations/pages/AcceptInvitationPage').then(m => ({ default: m.AcceptInvitationPage })));
const BrandingPage = lazy(() => import('@/features/organization/pages/BrandingPage').then(m => ({ default: m.BrandingPage })));
const PreferenciasOrganizacionPage = lazy(() => import('@/features/organization/pages/PreferenciasOrganizacionPage').then(m => ({ default: m.PreferenciasOrganizacionPage })));
const RelacionesOrganizacionPage = lazy(() => import('@/features/organization/pages/RelacionesOrganizacionPage').then(m => ({ default: m.RelacionesOrganizacionPage })));
const SolicitudesCambioPage = lazy(() => import('@/features/organization/pages/SolicitudesCambioPage').then(m => ({ default: m.SolicitudesCambioPage })));
const TraccarMapPage = lazy(() => import('@/features/traccar-map/pages/TraccarMapPage').then(m => ({ default: m.TraccarMapPage })));
const GeofencesPage = lazy(() => import('@/features/geofences/pages/GeofencesPage').then(m => ({ default: m.GeofencesPage })));
const GeofenceEditorPage = lazy(() => import('@/features/geofences/pages/GeofenceEditorPage').then(m => ({ default: m.GeofenceEditorPage })));
const GeofenceMapViewPage = lazy(() => import('@/features/geofences/pages/GeofenceMapViewPage').then(m => ({ default: m.GeofenceMapViewPage })));
const ImportsPage = lazy(() => import('@/features/imports/pages/ImportsPage').then(m => ({ default: m.ImportsPage })));
const DevicePublicPage = lazy(() => import('@/features/devices/pages/DevicePublicPage').then(m => ({ default: m.DevicePublicPage })));
const SuscripcionPage = lazy(() => import('@/features/subscription/pages/SubscriptionPage').then(m => ({ default: m.SuscripcionPage })));

function SuspensePage({ Component }: { Component: LazyExoticComponent<ComponentType> }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: '/d/:codigoQr',
    element: <SuspensePage Component={DevicePublicPage} />,
  },
  {
    path: '/login',
    element: <SuspensePage Component={LoginPage} />,
  },
  {
    path: '/registro',
    element: <SuspensePage Component={RegistroPage} />,
  },
  {
    path: '/activar-cuenta',
    element: <SuspensePage Component={ActivacionCuentaPage} />,
  },
  {
    path: '/invitacion/:token',
    element: <SuspensePage Component={AcceptInvitationPage} />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <SuspensePage Component={DashboardPage} /> },
      { path: 'vehiculos', element: <SuspensePage Component={VehiclesPage} /> },
      { path: 'dispositivos', element: <SuspensePage Component={DevicesPage} /> },
      { path: 'usuarios', element: <SuspensePage Component={UsersPage} /> },
      { path: 'conductores', element: <SuspensePage Component={DriversPage} /> },
      { path: 'mapa', element: <SuspensePage Component={TraccarMapPage} /> },
      { path: 'configuracion/empresa/apariencia', element: <SuspensePage Component={BrandingPage} /> },
      { path: 'configuracion/empresa/preferencias', element: <SuspensePage Component={PreferenciasOrganizacionPage} /> },
      { path: 'configuracion/empresa/relaciones', element: <SuspensePage Component={RelacionesOrganizacionPage} /> },
      { path: 'configuracion/empresa/solicitudes-cambio', element: <SuspensePage Component={SolicitudesCambioPage} /> },
      { path: 'geozonas', element: <SuspensePage Component={GeofencesPage} /> },
      { path: 'geozonas/mapa', element: <SuspensePage Component={GeofenceMapViewPage} /> },
      { path: 'geozonas/crear', element: <SuspensePage Component={GeofenceEditorPage} /> },
      { path: 'geozonas/:id/editar', element: <SuspensePage Component={GeofenceEditorPage} /> },
      { path: 'importaciones', element: <SuspensePage Component={ImportsPage} /> },
      { path: 'suscripcion', element: <SuspensePage Component={SuscripcionPage} /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/500',
    element: <ServerErrorPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export const B2BRouter = AppRouter;
