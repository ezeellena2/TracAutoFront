import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Car, Cpu, Bell, Wifi, AlertTriangle, RefreshCw, Activity, Map, MapPin, FileSpreadsheet } from 'lucide-react';
import { KPICard, Card, CardHeader, Badge, EstadoError, EstadoVacio } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils';
import { useLocalization } from '@/hooks/useLocalization';
import { useDashboardData } from '../hooks/useDashboardData';
import { TipoReglaAlerta, TipoNotificacion } from '../types';
import { useTenantStore } from '@/store';

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { timeZoneId, culture } = useLocalization();
  const { kpis, alertasRecientes, alertasNoLeidas, isLoading, error, refetch, tieneTelematica } = useDashboardData();
  const orgName = useTenantStore((s) => s.currentOrganization?.name);

  const getAlertaIcon = (tipo: TipoReglaAlerta) => {
    switch (tipo) {
      case TipoReglaAlerta.VelocidadMaxima:
        return <Activity className="text-warning" size={16} />;
      case TipoReglaAlerta.EntradaGeocerca:
      case TipoReglaAlerta.SalidaGeocerca:
        return <Car className="text-info" size={16} />;
      case TipoReglaAlerta.BateriaBaja:
      case TipoReglaAlerta.RpmFueraDeRango:
      case TipoReglaAlerta.TemperaturaMotorAlta:
        return <Cpu className="text-error" size={16} />;
      case TipoReglaAlerta.Desconexion:
        return <Wifi className="text-text-muted" size={16} />;
      default:
        return <Bell className="text-warning" size={16} />;
    }
  };

  const getSeveridadVariant = (severidad: TipoNotificacion): 'info' | 'success' | 'warning' | 'error' => {
    switch (severidad) {
      case TipoNotificacion.Error:
      case TipoNotificacion.SystemAlert:
        return 'error';
      case TipoNotificacion.Warning:
        return 'warning';
      case TipoNotificacion.Success:
        return 'success';
      default:
        return 'info';
    }
  };

  // --- Fallback: org sin Telematica → dashboard de bienvenida ---
  if (!tieneTelematica) {
    const quickLinks = [
      { icon: Car, label: t('sidebar.vehicles'), path: '/vehiculos', color: 'primary' },
      { icon: Map, label: t('sidebar.map'), path: '/mapa', color: 'primary' },
      { icon: MapPin, label: t('sidebar.geofences'), path: '/geozonas', color: 'primary' },
      { icon: FileSpreadsheet, label: t('sidebar.imports'), path: '/importaciones', color: 'primary' },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {t('dashboard.welcome', { name: orgName ?? '' })}
          </h1>
          <p className="text-text-muted mt-1">
            {t('dashboard.welcomeSubtitle', 'Accedé rápidamente a las secciones principales de tu organización.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-surface hover:border-primary hover:shadow-lg transition-all duration-200 group cursor-pointer"
            >
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <link.icon size={28} className="text-primary" />
              </div>
              <span className="font-medium text-text group-hover:text-primary transition-colors">
                {link.label}
              </span>
            </button>
          ))}
        </div>

        <Card>
          <CardHeader
            title={t('dashboard.moduleTelematicaTitle', 'Módulo Telemática')}
            subtitle={t('dashboard.moduleTelematicaDesc', 'Activá el módulo de Telemática para ver KPIs de flota, alertas en tiempo real y analíticas de conducción.')}
          />
        </Card>
      </div>
    );
  }

  if (error && !kpis) {
    return <EstadoError mensaje={t('dashboard.errorLoading')} onReintentar={refetch} />;
  }

  const vehiculosActivos = kpis?.vehiculosConTelemetria ?? 0;
  const vehiculosTotal = kpis?.vehiculosTotales ?? 0;
  const alertasHoy = kpis?.alertasGeneradas ?? 0;
  const tasaConexion = vehiculosTotal > 0
    ? Math.round((vehiculosActivos / vehiculosTotal) * 100)
    : 0;
  const alertas = alertasRecientes?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('dashboard.title')}</h1>
          <p className="text-text-muted mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <button
          onClick={refetch}
          className="p-2 rounded-lg hover:bg-surface transition-colors text-text-muted hover:text-text"
          title={t('common.refresh')}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface rounded-xl border border-border p-6 animate-pulse">
                <div className="h-4 bg-border rounded w-24 mb-3" />
                <div className="h-8 bg-border rounded w-16 mb-2" />
                <div className="h-3 bg-border rounded w-20" />
              </div>
            ))}
          </>
        ) : (
          <>
            <KPICard
              title={t('dashboard.activeVehicles')}
              value={vehiculosActivos}
              subtitle={t('dashboard.ofTotal', { total: vehiculosTotal })}
              icon={Car}
              color="primary"
            />
            <KPICard
              title={t('dashboard.eventsToday')}
              value={alertasHoy}
              subtitle={`${alertasNoLeidas ?? 0} ${t('dashboard.open')}`}
              icon={Bell}
              color="warning"
            />
            <KPICard
              title={t('dashboard.openAssistances')}
              value={alertasNoLeidas ?? 0}
              icon={AlertTriangle}
              color="error"
            />
            <KPICard
              title={t('dashboard.connectionRate')}
              value={`${tasaConexion}%`}
              subtitle={t('dashboard.devicesOnlineSubtitle')}
              icon={Wifi}
              color="success"
            />
          </>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader
          title={t('dashboard.recentActivity')}
          subtitle={t('dashboard.recentActivitySubtitle')}
        />
        <div className="space-y-4">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-background animate-pulse">
                <div className="w-10 h-10 bg-border rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-border rounded w-48 mb-2" />
                  <div className="h-3 bg-border rounded w-24" />
                </div>
              </div>
            ))
          ) : alertas.length === 0 ? (
            <EstadoVacio
              titulo={t('dashboard.noActivity')}
              descripcion={t('dashboard.noActivityDesc')}
            />
          ) : (
            alertas.map((alerta) => (
              <div
                key={alerta.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-background hover:bg-background/80 transition-colors"
              >
                <div className="p-2 rounded-lg bg-surface">
                  {getAlertaIcon(alerta.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">
                    {alerta.titulo}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{alerta.mensaje}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {alerta.patente && (
                      <Badge variant="info" size="sm">
                        {alerta.patente}
                      </Badge>
                    )}
                    <Badge variant={getSeveridadVariant(alerta.severidad)} size="sm">
                      {alerta.severidad === TipoNotificacion.Error ? t('dashboard.severityHigh') : t('dashboard.severityMedium')}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      {formatDateTime(alerta.timestampEvento, culture, timeZoneId)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title={t('dashboard.fleetStatus')} />
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-border rounded w-32" />
                  <div className="h-4 bg-border rounded w-8" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{t('dashboard.vehiclesWithTelemetry')}</span>
                <span className="font-semibold text-text">{vehiculosActivos}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{t('dashboard.totalDistance')}</span>
                <span className="font-semibold text-text">{kpis?.distanciaTotalKm?.toFixed(1) ?? 0} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{t('dashboard.avgSpeed')}</span>
                <span className="font-semibold text-text">{kpis?.velocidadPromedioKmh?.toFixed(1) ?? 0} km/h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{t('dashboard.obd2Readings')}</span>
                <span className="font-semibold text-text">{kpis?.lecturasObd2 ?? 0}</span>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title={t('dashboard.eventsByType')} />
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-border rounded w-32" />
                  <div className="h-6 bg-border rounded w-8" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {alertasRecientes?.estadisticas ? (
                Object.entries(alertasRecientes.estadisticas).map(([tipo, count]) => (
                  <div key={tipo} className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">{tipo}</span>
                    <Badge variant="warning">{count}</Badge>
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">{t('dashboard.totalAlerts')}</span>
                    <Badge variant="warning">{kpis?.alertasGeneradas ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">{t('dashboard.validPositions')}</span>
                    <Badge variant="success">{kpis?.posicionesValidas ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">{t('dashboard.invalidPositions')}</span>
                    <Badge variant="error">{kpis?.posicionesInvalidas ?? 0}</Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
