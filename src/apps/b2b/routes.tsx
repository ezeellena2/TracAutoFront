import { lazy, Suspense } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '@/apps/b2b/layouts';
import { ProtectedRoute } from '@/app/routes/ProtectedRoute';
import { ModuleGuard } from '@/shared/components/ModuleGuard';
import { ModuloSistema } from '@/shared/types/api';
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
const DevicePublicPage = lazy(() => import('@/features/devices/pages/DevicePublicPage').then(m => ({ default: m.DevicePublicPage })));

// Tracking Links
const TrackingLinksPage = lazy(() => import('@/features/tracking-links/pages/TrackingLinksPage').then(m => ({ default: m.TrackingLinksPage })));
const TrackingPublicoPage = lazy(() => import('@/features/tracking-publico/pages/TrackingPublicoPage').then(m => ({ default: m.TrackingPublicoPage })));

// Preferencias Notificacion (WhatsApp)
const PreferenciasNotificacionPage = lazy(() => import('@/features/preferencias-notificacion/pages/PreferenciasNotificacionPage').then(m => ({ default: m.PreferenciasNotificacionPage })));

// Resumen IA
const ResumenIAPage = lazy(() => import('@/features/resumen-ia/pages/ResumenIAPage').then(m => ({ default: m.ResumenIAPage })));

// Scoring
const ScoringDashboardPage = lazy(() => import('@/features/scoring/pages/ScoringDashboardPage').then(m => ({ default: m.ScoringDashboardPage })));
const ScoringConductorDetallePage = lazy(() => import('@/features/scoring/pages/ScoringConductorDetallePage').then(m => ({ default: m.ScoringConductorDetallePage })));
const ScoringConfigPage = lazy(() => import('@/features/scoring/pages/ScoringConfigPage').then(m => ({ default: m.ScoringConfigPage })));

// Billing / Suscripción
const BillingPage = lazy(() => import('@/features/billing/pages/BillingPage').then(m => ({ default: m.BillingPage })));

// Reglas de Alerta
const AlertRulesPage = lazy(() => import('@/features/alert-rules/pages/AlertRulesPage').then(m => ({ default: m.AlertRulesPage })));

// OBD2 Diagnostics
const OBDDashboardPage = lazy(() => import('@/features/obd-diagnostics/pages/OBDDashboardPage').then(m => ({ default: m.OBDDashboardPage })));

// Admin (SuperAdmin)
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));

// Widgets Embebibles
const WidgetsPage = lazy(() => import('@/features/widget/pages/WidgetsPage').then(m => ({ default: m.WidgetsPage })));

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

// Wrapper con ModuleGuard + Suspense para rutas que requieren módulo
function GuardedPage({ Component, modules }: { Component: LazyExoticComponent<ComponentType>; modules: ModuloSistema[] }) {
  return (
    <ModuleGuard allowedModules={modules} showAccessDenied>
      <SuspensePage Component={Component} />
    </ModuleGuard>
  );
}

const router = createBrowserRouter([
  // Public route for QR code device page (no auth required)
  {
    path: '/d/:codigoQr',
    element: <SuspensePage Component={DevicePublicPage} />,
  },
  // Public route for tracking links (no auth required)
  {
    path: '/t/:token',
    element: <SuspensePage Component={TrackingPublicoPage} />,
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
        // FIX H-F7: Guardia de rol explicita para ruta admin (solo SuperAdmin).
        // ROUTE_ACCESS ya lo filtra, pero un guard explicito en la ruta
        // garantiza proteccion incluso si la logica de ROUTE_ACCESS cambia.
        path: 'admin',
        element: (
          <ProtectedRoute requiredRoles={['SuperAdmin']}>
            <SuspensePage Component={AdminDashboardPage} />
          </ProtectedRoute>
        ),
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
        element: <GuardedPage Component={EventsPage} modules={[ModuloSistema.Telematica]} />,
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
        element: <GuardedPage Component={MarketplacePage} modules={[ModuloSistema.Marketplace]} />,
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
      {
        path: 'tracking-links',
        element: <SuspensePage Component={TrackingLinksPage} />,
      },
      {
        path: 'widgets',
        element: <SuspensePage Component={WidgetsPage} />,
      },
      {
        path: 'preferencias-notificacion',
        element: <SuspensePage Component={PreferenciasNotificacionPage} />,
      },
      {
        path: 'resumen-ia',
        element: <SuspensePage Component={ResumenIAPage} />,
      },
      // Scoring de conduccion — requiere módulo Scoring
      {
        path: 'scoring',
        element: <GuardedPage Component={ScoringDashboardPage} modules={[ModuloSistema.Scoring]} />,
      },
      {
        path: 'scoring/conductores/:id',
        element: <GuardedPage Component={ScoringConductorDetallePage} modules={[ModuloSistema.Scoring]} />,
      },
      {
        path: 'scoring/configuracion',
        element: <GuardedPage Component={ScoringConfigPage} modules={[ModuloSistema.Scoring]} />,
      },
      // Alquileres — requiere módulo Alquiler
      {
        path: 'alquileres',
        element: <GuardedPage Component={DashboardAlquileresPage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'alquileres/flota',
        element: <GuardedPage Component={FlotaAlquilerPage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'alquileres/sucursales',
        element: <GuardedPage Component={SucursalesPage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'alquileres/tarifas',
        element: <GuardedPage Component={TarifasPage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'alquileres/recargos',
        element: <GuardedPage Component={RecargosPage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'alquileres/coberturas',
        element: <GuardedPage Component={CoberturasPage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'alquileres/promociones',
        element: <GuardedPage Component={PromocionesPage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'alquileres/reservas',
        element: <GuardedPage Component={ReservasPage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'alquileres/reservas/:id',
        element: <GuardedPage Component={ReservaDetallePage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'alquileres/clientes',
        element: <GuardedPage Component={ClientesAlquilerPage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'alquileres/contratos',
        element: <GuardedPage Component={ContratosPage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'alquileres/reportes',
        element: <GuardedPage Component={ReportesAlquilerPage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'alquileres/configuracion',
        element: <GuardedPage Component={ConfiguracionAlquilerPage} modules={[ModuloSistema.Alquiler]} />,
      },
      {
        path: 'suscripcion',
        element: <SuspensePage Component={BillingPage} />,
      },
      {
        path: 'alertas/reglas',
        element: <GuardedPage Component={AlertRulesPage} modules={[ModuloSistema.Telematica]} />,
      },
      {
        path: 'diagnosticos-obd',
        element: <GuardedPage Component={OBDDashboardPage} modules={[ModuloSistema.Telematica]} />,
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
