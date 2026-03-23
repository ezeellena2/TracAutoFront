import { Car, Cpu, Map, Building2, MapPin, ShoppingCart, FileText, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardHeader, Badge } from '@/shared/ui';
import { useTenantStore } from '@/store';

const quickLinks = [
  { to: '/vehiculos', icon: Car, label: 'sidebar.vehicles' },
  { to: '/dispositivos', icon: Cpu, label: 'sidebar.devices' },
  { to: '/mapa', icon: Map, label: 'sidebar.map' },
  { to: '/geozonas', icon: MapPin, label: 'sidebar.geofences' },
  { to: '/marketplace', icon: ShoppingCart, label: 'marketplace.title' },
  { to: '/configuracion/empresa/solicitudes-cambio', icon: FileText, label: 'sidebar.organizationChangeRequests' },
  { to: '/configuracion/empresa/preferencias', icon: Building2, label: 'sidebar.organizationPreferences' },
  { to: '/suscripcion', icon: CreditCard, label: 'sidebar.subscription' },
];

export function DashboardPage() {
  const { t } = useTranslation();
  const { currentOrganization } = useTenantStore();
  const modulosActivos = currentOrganization?.modulosActivos ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('dashboard.title')}</h1>
        <p className="mt-1 text-text-muted">{t('dashboard.subtitle')}</p>
      </div>

      <Card>
        <CardHeader title={currentOrganization?.name ?? 'TracAuto'} subtitle={t('organization.preferences.subtitle')} />
        <div className="flex flex-wrap gap-2">
          {modulosActivos.length > 0 ? (
            modulosActivos.map((modulo) => (
              <Badge key={modulo} variant="success">{modulo}</Badge>
            ))
          ) : (
            <p className="text-sm text-text-muted">{t('subscription.empty')}</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to}>
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-surface-elevated">
              <div className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-medium text-text">{t(label)}</p>
                  <p className="text-sm text-text-muted">{to}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
