import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '@/hooks/useLocalization';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, Badge, Button } from '@/shared/ui';
import { useAuthStore } from '@/store';
import { formatDateTime } from '@/shared/utils';

// TODO: Replace with real events API when available
interface EventItem {
  id: string;
  tipo: string;
  severidad: string;
  estado: 'open' | 'in_progress' | 'resolved';
  descripcion: string;
  patente: string;
  ubicacion: string;
  fecha: string;
}

const initialEvents: EventItem[] = [
  { id: '1', tipo: 'exceso_velocidad', severidad: 'warning', estado: 'open', descripcion: 'Velocidad máxima superada: 120 km/h', patente: 'ABC-123', ubicacion: 'Av. Corrientes 1234', fecha: new Date().toISOString() },
  { id: '2', tipo: 'dtc_critico', severidad: 'error', estado: 'in_progress', descripcion: 'Código DTC P0300 detectado', patente: 'XYZ-789', ubicacion: 'Ruta 9 Km 45', fecha: new Date().toISOString() },
  { id: '3', tipo: 'geofence', severidad: 'info', estado: 'open', descripcion: 'Vehículo salió de zona autorizada', patente: 'DEF-456', ubicacion: 'Zona Norte', fecha: new Date().toISOString() },
  { id: '4', tipo: 'choque', severidad: 'error', estado: 'resolved', descripcion: 'Impacto moderado detectado', patente: 'GHI-321', ubicacion: 'Av. Santa Fe 2500', fecha: new Date().toISOString() },
];

export function EventsPage() {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const { user } = useAuthStore();

  const canResolve = user?.rol === 'Admin' || user?.rol === 'Operador';

  const filteredEvents = events.filter(e => 
    filter === 'all' || e.estado === filter
  );

  const handleResolve = (eventId: string) => {
    if (!canResolve) return;
    setEvents(prev => 
      prev.map(e => e.id === eventId ? { ...e, estado: 'resolved' } : e)
    );
  };

  const getSeverityBadge = (severidad: string) => {
    switch (severidad) {
      case 'error': return <Badge variant="error">{t('events.severity.critical')}</Badge>;
      case 'warning': return <Badge variant="warning">{t('events.severity.warning')}</Badge>;
      case 'info': return <Badge variant="info">{t('events.severity.info')}</Badge>;
      default: return <Badge>{severidad}</Badge>;
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'open': return <Badge variant="error">{t('events.status.open')}</Badge>;
      case 'in_progress': return <Badge variant="warning">{t('events.status.inProgress')}</Badge>;
      case 'resolved': return <Badge variant="success">{t('events.status.resolved')}</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  const getTipoIcon = (tipo: string) => {
    const iconClass = "w-10 h-10 rounded-xl flex items-center justify-center";
    switch (tipo) {
      case 'exceso_velocidad':
        return <div className={`${iconClass} bg-warning/10`}><AlertTriangle className="text-warning" size={20} /></div>;
      case 'choque':
      case 'robo':
      case 'dtc_critico':
        return <div className={`${iconClass} bg-error/10`}><AlertTriangle className="text-error" size={20} /></div>;
      case 'geofence':
        return <div className={`${iconClass} bg-primary/10`}><AlertTriangle className="text-primary" size={20} /></div>;
      default:
        return <div className={`${iconClass} bg-surface`}><AlertTriangle className="text-text-muted" size={20} /></div>;
    }
  };

  const formatTipo = (tipo: string) => {
    const tipos: Record<string, string> = {
      'exceso_velocidad': t('events.types.speedExceeded'),
      'geofence': t('events.types.geofence'),
      'dtc_critico': t('events.types.dtcCritical'),
      'choque': t('events.types.crash'),
      'robo': t('events.types.theft'),
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('events.title')}</h1>
          <p className="text-text-muted mt-1">{t('events.subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Button 
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          {t('events.filters.all')} ({events.length})
        </Button>
        <Button 
          variant={filter === 'open' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('open')}
        >
          {t('events.filters.open')} ({events.filter(e => e.estado === 'open').length})
        </Button>
        <Button 
          variant={filter === 'in_progress' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('in_progress')}
        >
          {t('events.filters.inProgress')} ({events.filter(e => e.estado === 'in_progress').length})
        </Button>
        <Button 
          variant={filter === 'resolved' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('resolved')}
        >
          {t('events.filters.resolved')} ({events.filter(e => e.estado === 'resolved').length})
        </Button>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredEvents.map((event, index) => (
          <Card key={event.id} className="relative">
            {/* Timeline line */}
            {index < filteredEvents.length - 1 && (
              <div className="absolute left-[29px] top-[72px] w-0.5 h-[calc(100%+16px)] bg-border" />
            )}
            
            <div className="flex gap-4">
              {/* Icon */}
              {getTipoIcon(event.tipo)}
              
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text">{formatTipo(event.tipo)}</h3>
                      {getSeverityBadge(event.severidad)}
                      {getStatusBadge(event.estado)}
                    </div>
                    <p className="text-sm text-text-muted">{event.descripcion}</p>
                  </div>
                  
                  {/* Actions */}
                  {event.estado !== 'resolved' && (
                    <div>
                      {canResolve ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResolve(event.id)}
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
                
                {/* Meta */}
                <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Badge variant="info" size="sm">{event.patente}</Badge>
                  </span>
                  <span>{event.ubicacion}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDateTime(new Date(event.fecha), culture, timeZoneId)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
