import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AlquilerLayout } from '@/apps/alquiler/layouts';
import { NotFoundPage } from '@/shared/pages';

/**
 * Rutas del portal de alquiler público.
 * Se poblarán en fases posteriores (E-block).
 * Placeholder: / -> búsqueda, /reservar/:id -> reserva, /mis-reservas -> panel
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <AlquilerLayout />,
    children: [
      {
        index: true,
        element: <PlaceholderPage titulo="Búsqueda de Vehículos" />,
      },
      {
        path: 'reservar/:id',
        element: <PlaceholderPage titulo="Reservar Vehículo" />,
      },
      {
        path: 'mis-reservas',
        element: <PlaceholderPage titulo="Mis Reservas" />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

function PlaceholderPage({ titulo }: { titulo: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text mb-2">{titulo}</h1>
        <p className="text-text-muted">Próximamente — Fases E-block</p>
      </div>
    </div>
  );
}

export function AlquilerRouter() {
  return <RouterProvider router={router} />;
}
