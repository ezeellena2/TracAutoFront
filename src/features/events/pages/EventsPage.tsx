import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '@/hooks/useLocalization';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Badge, Button, EstadoError, EstadoVacio } from '@/shared/ui';
import { useAuthStore } from '@/store';
import { formatDateTime } from '@/shared/utils';
import { useEvents } from '../hooks/useEvents';
import {
  TipoReglaAlerta,
  TipoNotificacion,
  EstadoAlertaCerebro,
} from '@/features/dashboard/types';
import type { AlertaCerebroDto } from '@/features/dashboard/types';

type FilterState = 'all' | EstadoAlertaCerebro;

export function EventsPage() {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();
  const [filter, setFilter] = useState<FilterState>('all');
  const { user } = useAuthStore();

  const canResolve = user?.rol === 'Admin' || user?.rol === 'Operador';

  const estadoParam = filter === 'all' ? undefined : filter;
  const {
    alertas,
    totalRegistros,
    totalPaginas,
    paginaActual,
    isLoading,
    error,
    refetch,
    resolveAlerta,
    isResolving,
    setPage,
  } = useEvents({ estado: estadoParam });

  if (error && alertas.length === 0) {
    return <EstadoError mensaje={t('events.errorLoading')} onReintentar={refetch} />;
  }

  const getSeverityBadge = (severidad: TipoNotificacion) => {
    switch (severidad) {
      case TipoNotificacion.Error:
      case TipoNotificacion.SystemAlert:
        return <Badge variant="error">{t('events.severity.critical')}</Badge>;
      case TipoNotificacion.Warning:
        return <Badge variant="warning">{t('events.severity.warning')}</Badge>;
      default:
        return <Badge variant="info">{t('events.severity.info')}</Badge>;
    }
  };

  const getStatusBadge = (estado: EstadoAlertaCerebro) => {
    switch (estado) {
      case EstadoAlertaCerebro.Activa:
        return <Badge variant="error">{t('events.status.open')}</Badge>;
      case EstadoAlertaCerebro.Reconocida:
        return <Badge variant="warning">{t('events.status.inProgress')}</Badge>;
      case EstadoAlertaCerebro.Resuelta:
        return <Badge variant="success">{t('events.status.resolved')}</Badge>;
      case EstadoAlertaCerebro.Descartada:
        return <Badge variant="info">{t('events.status.dismissed')}</Badge>;
      default:
        return null;
    }
  };

  const getTipoIcon = (tipo: TipoReglaAlerta) => {
    const iconClass = 'w-10 h-10 rounded-xl flex items-center justify-center';
    switch (tipo) {
      case TipoReglaAlerta.VelocidadMaxima:
        return <div className={`${iconClass} bg-warning/10`}><AlertTriangle className="text-warning" size={20} /></div>;
      case TipoReglaAlerta.BateriaBaja:
      case TipoReglaAlerta.RpmFueraDeRango:
      case TipoReglaAlerta.TemperaturaMotorAlta:
        return <div className={`${iconClass} bg-error/10`}><AlertTriangle className="text-error" size={20} /></div>;
      case TipoReglaAlerta.EntradaGeocerca:
      case TipoReglaAlerta.SalidaGeocerca:
        return <div className={`${iconClass} bg-primary/10`}><AlertTriangle className="text-primary" size={20} /></div>;
      case TipoReglaAlerta.Desconexion:
        return <div className={`${iconClass} bg-text-muted/10`}><AlertTriangle className="text-text-muted" size={20} /></div>;
      default:
        return <div className={`${iconClass} bg-surface`}><AlertTriangle className="text-text-muted" size={20} /></div>;
    }
  };

  const formatTipo = (tipo: TipoReglaAlerta): string => {
    const tipos: Record<number, string> = {
      [TipoReglaAlerta.VelocidadMaxima]: t('events.types.speedExceeded'),
      [TipoReglaAlerta.DetencionExcesiva]: t('events.types.excessiveStop'),
      [TipoReglaAlerta.EntradaGeocerca]: t('events.types.geofenceEntry'),
      [TipoReglaAlerta.SalidaGeocerca]: t('events.types.geofenceExit'),
      [TipoReglaAlerta.Desconexion]: t('events.types.disconnection'),
      [TipoReglaAlerta.RpmFueraDeRango]: t('events.types.rpmOutOfRange'),
      [TipoReglaAlerta.TemperaturaMotorAlta]: t('events.types.highEngineTemp'),
      [TipoReglaAlerta.BateriaBaja]: t('events.types.lowBattery'),
    };
    return tipos[tipo] || String(tipo);
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="animate-pulse">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-border rounded-xl" />
            <div className="flex-1">
              <div className="h-5 bg-border rounded w-48 mb-2" />
              <div className="h-4 bg-border rounded w-64 mb-3" />
              <div className="flex gap-2">
                <div className="h-5 bg-border rounded w-16" />
                <div className="h-5 bg-border rounded w-24" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('events.title')}</h1>
          <p className="text-text-muted mt-1">{t('events.subtitle')}</p>
        </div>
        <button
          onClick={refetch}
          className="p-2 rounded-lg hover:bg-surface transition-colors text-text-muted hover:text-text"
          title={t('common.refresh')}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => { setFilter('all'); setPage(1); }}
        >
          {t('events.filters.all')} ({totalRegistros})
        </Button>
        <Button
          variant={filter === EstadoAlertaCerebro.Activa ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => { setFilter(EstadoAlertaCerebro.Activa); setPage(1); }}
        >
          {t('events.filters.open')}
        </Button>
        <Button
          variant={filter === EstadoAlertaCerebro.Reconocida ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => { setFilter(EstadoAlertaCerebro.Reconocida); setPage(1); }}
        >
          {t('events.filters.inProgress')}
        </Button>
        <Button
          variant={filter === EstadoAlertaCerebro.Resuelta ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => { setFilter(EstadoAlertaCerebro.Resuelta); setPage(1); }}
        >
          {t('events.filters.resolved')}
        </Button>
      </div>

      {/* Timeline */}
      {isLoading ? (
        renderSkeleton()
      ) : alertas.length === 0 ? (
        <EstadoVacio
          titulo={t('events.noEvents')}
          descripcion={t('events.noEventsDesc')}
        />
      ) : (
        <div className="space-y-4">
          {alertas.map((alerta: AlertaCerebroDto, index: number) => (
            <Card key={alerta.id} className="relative">
              {index < alertas.length - 1 && (
                <div className="absolute left-[29px] top-[72px] w-0.5 h-[calc(100%+16px)] bg-border" />
              )}

              <div className="flex gap-4">
                {getTipoIcon(alerta.tipo)}

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-text">{formatTipo(alerta.tipo)}</h3>
                        {getSeverityBadge(alerta.severidad)}
                        {getStatusBadge(alerta.estado)}
                      </div>
                      <p className="text-sm font-medium text-text">{alerta.titulo}</p>
                      <p className="text-sm text-text-muted">{alerta.mensaje}</p>
                    </div>

                    {alerta.estado === EstadoAlertaCerebro.Activa && (
                      <div>
                        {canResolve ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveAlerta(alerta.id)}
                            disabled={isResolving}
                          >
                            <CheckCircle size={16} className="mr-1" />
                            {t('events.actions.resolve')}
                          </Button>
                        ) : (
                          <span className="text-xs text-text-muted italic">
                            {t('events.actions.onlyAdminCanResolve')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                    {alerta.patente && (
                      <Badge variant="info" size="sm">{alerta.patente}</Badge>
                    )}
                    {alerta.nombreGeofence && (
                      <span>{alerta.nombreGeofence}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDateTime(alerta.timestampEvento, culture, timeZoneId)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(paginaActual - 1)}
            disabled={paginaActual <= 1}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-text-muted">
            {t('common.pageOf', { current: paginaActual, total: totalPaginas })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(paginaActual + 1)}
            disabled={paginaActual >= totalPaginas}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
