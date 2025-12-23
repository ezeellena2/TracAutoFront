import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
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
import { BrandingPage } from '@/features/organization';
import { TraccarMapPage } from '@/features/traccar-map';
import { ReplayPage } from '@/features/replay';

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
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
