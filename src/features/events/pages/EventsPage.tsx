import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, Badge, Button } from '@/shared/ui';
import { mockEvents } from '@/services/mock';
import { useAuthStore } from '@/store';

// Event type is inferred from mockEvents

export function EventsPage() {
  const [events, setEvents] = useState(mockEvents);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const { user } = useAuthStore();

  const canResolve = user?.rol === 'Admin' || user?.rol === 'Operador';

  const filteredEvents = events.filter(e => 
    filter === 'all' || e.estado === filter
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleResolve = (eventId: string) => {
    if (!canResolve) return;
    setEvents(prev => 
      prev.map(e => e.id === eventId ? { ...e, estado: 'resolved' } : e)
    );
  };

  const getSeverityBadge = (severidad: string) => {
    switch (severidad) {
      case 'error': return <Badge variant="error">Crítico</Badge>;
      case 'warning': return <Badge variant="warning">Advertencia</Badge>;
      case 'info': return <Badge variant="info">Informativo</Badge>;
      default: return <Badge>{severidad}</Badge>;
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'open': return <Badge variant="error">Abierto</Badge>;
      case 'in_progress': return <Badge variant="warning">En Progreso</Badge>;
      case 'resolved': return <Badge variant="success">Resuelto</Badge>;
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
      'exceso_velocidad': 'Exceso de Velocidad',
      'geofence': 'Violación de Geofence',
      'dtc_critico': 'DTC Crítico',
      'choque': 'Colisión/Impacto',
      'robo': 'Alerta de Robo',
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Eventos</h1>
          <p className="text-text-muted mt-1">Timeline de eventos y alertas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Button 
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todos ({events.length})
        </Button>
        <Button 
          variant={filter === 'open' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('open')}
        >
          Abiertos ({events.filter(e => e.estado === 'open').length})
        </Button>
        <Button 
          variant={filter === 'in_progress' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('in_progress')}
        >
          En Progreso ({events.filter(e => e.estado === 'in_progress').length})
        </Button>
        <Button 
          variant={filter === 'resolved' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('resolved')}
        >
          Resueltos ({events.filter(e => e.estado === 'resolved').length})
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
                          Resolver
                        </Button>
                      ) : (
                        <span className="text-xs text-text-muted italic">
                          Solo Admin/Operador puede resolver
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
                    {formatDate(event.fecha)}
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
