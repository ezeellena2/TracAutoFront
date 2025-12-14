import { useState } from 'react';
import { Car, Cpu, Bell, Wifi, AlertTriangle, Clock } from 'lucide-react';
import { KPICard, Card, CardHeader, Badge } from '@/shared/ui';
import { mockDashboardKPIs, mockRecentActivity } from '@/services/mock';

export function DashboardPage() {
  const [kpis] = useState(mockDashboardKPIs);
  const [activity] = useState(mockRecentActivity);

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'evento': return <AlertTriangle className="text-warning\" size={16} />;
      case 'dispositivo': return <Cpu className="text-primary" size={16} />;
      case 'asistencia': return <Bell className="text-error" size={16} />;
      case 'usuario': return <Clock className="text-success" size={16} />;
      default: return <Clock className="text-text-muted" size={16} />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-text-muted mt-1">Resumen de actividad y métricas principales</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Vehículos Activos"
          value={kpis.vehiculosActivos}
          subtitle={`de ${kpis.vehiculosTotal} totales`}
          icon={Car}
          color="primary"
        />
        <KPICard
          title="Eventos Hoy"
          value={kpis.eventosHoy}
          subtitle={`${kpis.eventosAbiertos} abiertos`}
          icon={Bell}
          color="warning"
        />
        <KPICard
          title="Asistencias Abiertas"
          value={kpis.asistenciasAbiertas}
          icon={AlertTriangle}
          color="error"
        />
        <KPICard
          title="Tasa de Conexión"
          value={`${kpis.tasaConexion}%`}
          subtitle="Dispositivos online"
          icon={Wifi}
          color="success"
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader 
          title="Actividad Reciente"
          subtitle="Últimos eventos del sistema"
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
                    {formatDate(item.fecha)}
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
          <CardHeader title="Estado de Flota" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Vehículos en movimiento</span>
              <span className="font-semibold text-text">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Vehículos detenidos</span>
              <span className="font-semibold text-text">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Sin señal (+24h)</span>
              <span className="font-semibold text-error">1</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Eventos por Tipo" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Exceso de velocidad</span>
              <Badge variant="warning">1</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">DTC Crítico</span>
              <Badge variant="error">1</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Geofence</span>
              <Badge variant="info">1</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Impacto</span>
              <Badge variant="error">1</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
