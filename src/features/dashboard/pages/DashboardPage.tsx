import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Cpu, Bell, Wifi, AlertTriangle, Clock } from 'lucide-react';
import { KPICard, Card, CardHeader, Badge } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';
import { useLocalization } from '@/hooks/useLocalization';

// TODO: Replace with real dashboard API when available
const dashboardKPIs = {
  vehiculosActivos: 4,
  vehiculosTotal: 5,
  eventosHoy: 4,
  eventosAbiertos: 2,
  asistenciasAbiertas: 1,
  tasaConexion: 80,
};

const recentActivity = [
  { id: '1', tipo: 'evento', descripcion: 'Exceso de velocidad detectado', vehiculo: 'ABC-123', fecha: new Date().toISOString() },
  { id: '2', tipo: 'dispositivo', descripcion: 'GPS reconectado', vehiculo: 'XYZ-789', fecha: new Date().toISOString() },
];

export function DashboardPage() {
  const { t } = useTranslation();
  const { timeZoneId, culture } = useLocalization();
  const [kpis] = useState(dashboardKPIs);
  const [activity] = useState(recentActivity);

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'evento': return <AlertTriangle className="text-warning\" size={16} />;
      case 'dispositivo': return <Cpu className="text-primary" size={16} />;
      case 'asistencia': return <Bell className="text-error" size={16} />;
      case 'usuario': return <Clock className="text-success" size={16} />;
      default: return <Clock className="text-text-muted" size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text">{t('dashboard.title')}</h1>
        <p className="text-text-muted mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('dashboard.activeVehicles')}
          value={kpis.vehiculosActivos}
          subtitle={t('dashboard.ofTotal', { total: kpis.vehiculosTotal })}
          icon={Car}
          color="primary"
        />
        <KPICard
          title={t('dashboard.eventsToday')}
          value={kpis.eventosHoy}
          subtitle={`${kpis.eventosAbiertos} ${t('dashboard.open')}`}
          icon={Bell}
          color="warning"
        />
        <KPICard
          title={t('dashboard.openAssistances')}
          value={kpis.asistenciasAbiertas}
          icon={AlertTriangle}
          color="error"
        />
        <KPICard
          title={t('dashboard.connectionRate')}
          value={`${kpis.tasaConexion}%`}
          subtitle={t('dashboard.devicesOnlineSubtitle')}
          icon={Wifi}
          color="success"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader 
          title={t('dashboard.recentActivity')}
          subtitle={t('dashboard.recentActivitySubtitle')}
        />
        <div className="space-y-4">
          {activity.map((item) => (
            <div 
              key={item.id}
              className="flex items-start gap-4 p-4 rounded-lg bg-background hover:bg-background/80 transition-colors"
            >
              <div className="p-2 rounded-lg bg-surface">
                {getActivityIcon(item.tipo)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text">
                  {item.descripcion}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {item.vehiculo && (
                    <Badge variant="info" size="sm">
                      {item.vehiculo}
                    </Badge>
                  )}
                  <span className="text-xs text-text-muted">
                    {formatDateTime(item.fecha, culture, timeZoneId)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title={t('dashboard.fleetStatus')} />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{t('dashboard.vehiclesMoving')}</span>
              <span className="font-semibold text-text">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{t('dashboard.vehiclesStopped')}</span>
              <span className="font-semibold text-text">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{t('dashboard.noSignal')}</span>
              <span className="font-semibold text-error">1</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={t('dashboard.eventsByType')} />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{t('dashboard.speedExcess')}</span>
              <Badge variant="warning">1</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{t('dashboard.dtcCritical')}</span>
              <Badge variant="error">1</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{t('dashboard.geofence')}</span>
              <Badge variant="info">1</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{t('dashboard.impact')}</span>
              <Badge variant="error">1</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
