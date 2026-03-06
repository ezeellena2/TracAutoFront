import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AlquilerLayout } from '@/apps/alquiler/layouts';
import { NotFoundPage } from '@/shared/pages';
import { PageLoader } from '@/shared/ui';
import { ProtectedRouteCliente } from '@/features/alquiler-publico/components/ProtectedRouteCliente';

// Lazy pages
const BusquedaAlquilerPage = lazy(() => import('@/features/alquiler-publico/pages/BusquedaAlquilerPage'));
const ResultadosAlquilerPage = lazy(() => import('@/features/alquiler-publico/pages/ResultadosAlquilerPage'));
const DetalleAlquilerPage = lazy(() => import('@/features/alquiler-publico/pages/DetalleAlquilerPage'));
const ReservaFlowPage = lazy(() => import('@/features/alquiler-publico/pages/ReservaFlowPage'));
const LoginClientePage = lazy(() => import('@/features/alquiler-publico/pages/LoginClientePage'));
const RegistroClientePage = lazy(() => import('@/features/alquiler-publico/pages/RegistroClientePage'));
const VerificarOtpPage = lazy(() => import('@/features/alquiler-publico/pages/VerificarOtpPage'));
const MisReservasPage = lazy(() => import('@/features/alquiler-publico/pages/MisReservasPage'));
const ReservaEstadoPage = lazy(() => import('@/features/alquiler-publico/pages/ReservaEstadoPage'));

function SuspensePage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AlquilerLayout />,
    children: [
      // Rutas públicas (anónimas)
      {
        index: true,
        element: <SuspensePage><BusquedaAlquilerPage /></SuspensePage>,
      },
      {
        path: 'resultados',
        element: <SuspensePage><ResultadosAlquilerPage /></SuspensePage>,
      },
      {
        path: 'vehiculo/:id',
        element: <SuspensePage><DetalleAlquilerPage /></SuspensePage>,
      },
      {
        path: 'reservar/:id',
        element: <SuspensePage><ReservaFlowPage /></SuspensePage>,
      },
      // Auth B2C (login/registro/verificacion)
      {
        path: 'login',
        element: <SuspensePage><LoginClientePage /></SuspensePage>,
      },
      {
        path: 'registro',
        element: <SuspensePage><RegistroClientePage /></SuspensePage>,
      },
      {
        path: 'verificar-otp',
        element: <SuspensePage><VerificarOtpPage /></SuspensePage>,
      },
      // Rutas autenticadas B2C
      {
        path: 'mis-reservas',
        element: (
          <ProtectedRouteCliente>
            <SuspensePage><MisReservasPage /></SuspensePage>
          </ProtectedRouteCliente>
        ),
      },
      {
        path: 'mis-reservas/:id',
        element: (
          <ProtectedRouteCliente>
            <SuspensePage><ReservaEstadoPage /></SuspensePage>
          </ProtectedRouteCliente>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AlquilerRouter() {
  return <RouterProvider router={router} />;
}
