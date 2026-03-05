import { lazy, Suspense } from 'react';
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <AlquilerLayout />,
    children: [
      // Rutas públicas (anónimas)
      {
        index: true,
        element: <Suspense fallback={<PageLoader />}><BusquedaAlquilerPage /></Suspense>,
      },
      {
        path: 'resultados',
        element: <Suspense fallback={<PageLoader />}><ResultadosAlquilerPage /></Suspense>,
      },
      {
        path: 'vehiculo/:id',
        element: <Suspense fallback={<PageLoader />}><DetalleAlquilerPage /></Suspense>,
      },
      {
        path: 'reservar/:id',
        element: <Suspense fallback={<PageLoader />}><ReservaFlowPage /></Suspense>,
      },
      // Auth B2C (login/registro/verificacion)
      {
        path: 'login',
        element: <Suspense fallback={<PageLoader />}><LoginClientePage /></Suspense>,
      },
      {
        path: 'registro',
        element: <Suspense fallback={<PageLoader />}><RegistroClientePage /></Suspense>,
      },
      {
        path: 'verificar-otp',
        element: <Suspense fallback={<PageLoader />}><VerificarOtpPage /></Suspense>,
      },
      // Rutas autenticadas B2C
      {
        path: 'mis-reservas',
        element: (
          <ProtectedRouteCliente>
            <Suspense fallback={<PageLoader />}><MisReservasPage /></Suspense>
          </ProtectedRouteCliente>
        ),
      },
      {
        path: 'mis-reservas/:id',
        element: (
          <ProtectedRouteCliente>
            <Suspense fallback={<PageLoader />}><ReservaEstadoPage /></Suspense>
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
