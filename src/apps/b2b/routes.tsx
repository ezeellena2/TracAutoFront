import { lazy, Suspense } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '@/apps/b2b/layouts';
import { ProtectedRoute } from '@/app/routes/ProtectedRoute';
import { PageLoader } from '@/shared/ui';

// Lazy-loaded features para mejor code-splitting
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
const PreferenciasOrganizacionPage = lazy(() => import('@/features/organization/pages/PreferenciasOrganizacionPage').then(m => ({ default: m.PreferenciasOrganizacionPage })));
const RelacionesOrganizacionPage = lazy(() => import('@/features/organization/pages/RelacionesOrganizacionPage').then(m => ({ default: m.RelacionesOrganizacionPage })));
const SolicitudesCambioPage = lazy(() => import('@/features/organization/pages/SolicitudesCambioPage').then(m => ({ default: m.SolicitudesCambioPage })));
const TraccarMapPage = lazy(() => import('@/features/traccar-map/pages/TraccarMapPage').then(m => ({ default: m.TraccarMapPage })));
const ReplayPage = lazy(() => import('@/features/replay/pages/ReplayPage').then(m => ({ default: m.ReplayPage })));
const MarketplacePage = lazy(() => import('@/features/marketplace/pages/MarketplacePage').then(m => ({ default: m.MarketplacePage })));
const GeofencesPage = lazy(() => import('@/features/geofences/pages/GeofencesPage').then(m => ({ default: m.GeofencesPage })));
const GeofenceEditorPage = lazy(() => import('@/features/geofences/pages/GeofenceEditorPage').then(m => ({ default: m.GeofenceEditorPage })));
const GeofenceMapViewPage = lazy(() => import('@/features/geofences/pages/GeofenceMapViewPage').then(m => ({ default: m.GeofenceMapViewPage })));
const ImportsPage = lazy(() => import('@/features/imports/pages/ImportsPage').then(m => ({ default: m.ImportsPage })));
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));

// Alquileres
const DashboardAlquileresPage = lazy(() => import('@/features/alquileres/pages/DashboardAlquileresPage').then(m => ({ default: m.DashboardAlquileresPage })));
const FlotaAlquilerPage = lazy(() => import('@/features/alquileres/pages/FlotaAlquilerPage').then(m => ({ default: m.FlotaAlquilerPage })));
const SucursalesPage = lazy(() => import('@/features/alquileres/pages/SucursalesPage').then(m => ({ default: m.SucursalesPage })));
const TarifasPage = lazy(() => import('@/features/alquileres/pages/TarifasPage').then(m => ({ default: m.TarifasPage })));
const RecargosPage = lazy(() => import('@/features/alquileres/pages/RecargosPage').then(m => ({ default: m.RecargosPage })));
const CoberturasPage = lazy(() => import('@/features/alquileres/pages/CoberturasPage').then(m => ({ default: m.CoberturasPage })));
const PromocionesPage = lazy(() => import('@/features/alquileres/pages/PromocionesPage').then(m => ({ default: m.PromocionesPage })));
const ReservasPage = lazy(() => import('@/features/alquileres/pages/ReservasPage').then(m => ({ default: m.ReservasPage })));
const ReservaDetallePage = lazy(() => import('@/features/alquileres/pages/ReservaDetallePage').then(m => ({ default: m.ReservaDetallePage })));
const ClientesAlquilerPage = lazy(() => import('@/features/alquileres/pages/ClientesAlquilerPage').then(m => ({ default: m.ClientesAlquilerPage })));
const ContratosPage = lazy(() => import('@/features/alquileres/pages/ContratosPage').then(m => ({ default: m.ContratosPage })));
const ReportesAlquilerPage = lazy(() => import('@/features/alquileres/pages/ReportesAlquilerPage').then(m => ({ default: m.ReportesAlquilerPage })));
const ConfiguracionAlquilerPage = lazy(() => import('@/features/alquileres/pages/ConfiguracionAlquilerPage').then(m => ({ default: m.ConfiguracionAlquilerPage })));

// Error pages — se cargan eager porque son pequeñas y críticas
import { NotFoundPage, ServerErrorPage } from '@/shared/pages';

// Wrapper con Suspense para componentes lazy
function SuspensePage({ Component }: { Component: LazyExoticComponent<ComponentType> }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <SuspensePage Component={LoginPage} />,
  },
  {
    path: '/registro',
    element: <SuspensePage Component={RegistroPage} />,
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
      {
        index: true,
        element: <SuspensePage Component={DashboardPage} />,
      },
      {
        path: 'vehiculos',
        element: <SuspensePage Component={VehiclesPage} />,
      },
      {
        path: 'dispositivos',
        element: <SuspensePage Component={DevicesPage} />,
      },
      {
        path: 'eventos',
        element: <SuspensePage Component={EventsPage} />,
      },
      {
        path: 'usuarios',
        element: <SuspensePage Component={UsersPage} />,
      },
      {
        path: 'conductores',
        element: <SuspensePage Component={DriversPage} />,
      },
      {
        path: 'marketplace',
        element: <SuspensePage Component={MarketplacePage} />,
      },
      {
        path: 'mapa',
        element: <SuspensePage Component={TraccarMapPage} />,
      },
      {
        path: 'replay',
        element: <SuspensePage Component={ReplayPage} />,
      },
      {
        path: 'configuracion/empresa/apariencia',
        element: <SuspensePage Component={BrandingPage} />,
      },
      {
        path: 'configuracion/empresa/preferencias',
        element: <SuspensePage Component={PreferenciasOrganizacionPage} />,
      },
      {
        path: 'configuracion/empresa/relaciones',
        element: <SuspensePage Component={RelacionesOrganizacionPage} />,
      },
      {
        path: 'configuracion/empresa/solicitudes-cambio',
        element: <SuspensePage Component={SolicitudesCambioPage} />,
      },
      {
        path: 'geozonas',
        element: <SuspensePage Component={GeofencesPage} />,
      },
      {
        path: 'geozonas/mapa',
        element: <SuspensePage Component={GeofenceMapViewPage} />,
      },
      {
        path: 'geozonas/crear',
        element: <SuspensePage Component={GeofenceEditorPage} />,
      },
      {
        path: 'geozonas/:id/editar',
        element: <SuspensePage Component={GeofenceEditorPage} />,
      },
      {
        path: 'importaciones',
        element: <SuspensePage Component={ImportsPage} />,
      },
      // Alquileres
      {
        path: 'alquileres',
        element: <SuspensePage Component={DashboardAlquileresPage} />,
      },
      {
        path: 'alquileres/flota',
        element: <SuspensePage Component={FlotaAlquilerPage} />,
      },
      {
        path: 'alquileres/sucursales',
        element: <SuspensePage Component={SucursalesPage} />,
      },
      {
        path: 'alquileres/tarifas',
        element: <SuspensePage Component={TarifasPage} />,
      },
      {
        path: 'alquileres/recargos',
        element: <SuspensePage Component={RecargosPage} />,
      },
      {
        path: 'alquileres/coberturas',
        element: <SuspensePage Component={CoberturasPage} />,
      },
      {
        path: 'alquileres/promociones',
        element: <SuspensePage Component={PromocionesPage} />,
      },
      {
        path: 'alquileres/reservas',
        element: <SuspensePage Component={ReservasPage} />,
      },
      {
        path: 'alquileres/reservas/:id',
        element: <SuspensePage Component={ReservaDetallePage} />,
      },
      {
        path: 'alquileres/clientes',
        element: <SuspensePage Component={ClientesAlquilerPage} />,
      },
      {
        path: 'alquileres/contratos',
        element: <SuspensePage Component={ContratosPage} />,
      },
      {
        path: 'alquileres/reportes',
        element: <SuspensePage Component={ReportesAlquilerPage} />,
      },
      {
        path: 'alquileres/configuracion',
        element: <SuspensePage Component={ConfiguracionAlquilerPage} />,
      },
      {
        path: 'notificaciones',
        element: <SuspensePage Component={NotificationsPage} />,
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

export function B2BRouter() {
  return <RouterProvider router={router} />;
}
