import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '@/app/layouts';
import { ProtectedRoute } from './ProtectedRoute';

// Features
import { LoginPage, RegistroPage } from '@/features/auth';
import { DashboardPage } from '@/features/dashboard';
import { VehiclesPage } from '@/features/vehicles';
import { DevicesPage } from '@/features/devices';
import { EventsPage } from '@/features/events';
import { UsersPage } from '@/features/users';
import { DriversPage } from '@/features/drivers';
import { AcceptInvitationPage } from '@/features/invitations/pages/AcceptInvitationPage';
import { BrandingPage, RelacionesOrganizacionPage } from '@/features/organization';
import { TraccarMapPage } from '@/features/traccar-map';
import { ReplayPage } from '@/features/replay';
import { MarketplacePage } from '@/features/marketplace';
import { TurnosTaxiPage } from '@/features/turnos-taxi';

// Error pages
import { NotFoundPage, ServerErrorPage } from '@/shared/pages';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/registro',
    element: <RegistroPage />,
  },
  {
    path: '/invitacion/:token',
    element: <AcceptInvitationPage />,
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
        element: <DashboardPage />,
      },
      {
        path: 'vehiculos',
        element: <VehiclesPage />,
      },
      {
        path: 'dispositivos',
        element: <DevicesPage />,
      },
      {
        path: 'eventos',
        element: <EventsPage />,
      },
      {
        path: 'usuarios',
        element: <UsersPage />,
      },
      {
        path: 'conductores',
        element: <DriversPage />,
      },
      {
        path: 'marketplace',
        element: <MarketplacePage />,
      },
      {
        path: 'mapa',
        element: <TraccarMapPage />,
      },
      {
        path: 'replay',
        element: <ReplayPage />,
      },
      {
        path: 'configuracion/empresa/apariencia',
        element: <BrandingPage />,
      },
      {
        path: 'configuracion/empresa/relaciones',
        element: <RelacionesOrganizacionPage />,
      },
      {
        path: 'turnos-taxi',
        element: <TurnosTaxiPage />,
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
