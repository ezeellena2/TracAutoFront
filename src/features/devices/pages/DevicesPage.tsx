import { useCallback, useEffect, useState } from 'react';
import { Wifi, WifiOff, Settings, AlertCircle } from 'lucide-react';
import { Card, Table, Badge, Button } from '@/shared/ui';
import { dispositivosApi } from '@/services/endpoints';
import { usePermissions } from '@/hooks';
import type { DispositivoDto } from '@/shared/types/api';

export function DevicesPage() {
  const [devices, setDevices] = useState<DispositivoDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { can } = usePermissions();

  const loadDevices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await dispositivosApi.getDispositivos();
      setDevices(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo cargar la lista de dispositivos';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar dispositivos al montar el componente
  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  // Permisos
  const canAssign = can('dispositivos:asignar');
  const canConfigure = can('dispositivos:configurar');

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstadoBadge = (estado: string | null) => {
    if (!estado) return <Badge variant="info">Desconocido</Badge>;
    switch (estado) {
      case 'online': return <Badge variant="success">Online</Badge>;
      case 'offline': return <Badge variant="error">Offline</Badge>;
      default: return <Badge variant="info">{estado}</Badge>;
    }
  };

  const columns = [
    { key: 'nombre', header: 'Nombre', sortable: true },
    {
      key: 'estado',
      header: 'Estado',
      render: (d: DispositivoDto) => getEstadoBadge(d.estado)
    },
    {
      key: 'ultimaActualizacionUtc',
      header: 'Última actualización',
      render: (d: DispositivoDto) => formatDate(d.ultimaActualizacionUtc)
    },
    {
      key: 'activo',
      header: 'Activo',
      render: (d: DispositivoDto) => (
        d.activo ? <Badge variant="success">Sí</Badge> : <Badge variant="error">No</Badge>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_d: DispositivoDto) => {
        // Sin permiso de asignar, no mostrar acciones
        if (!canAssign && !canConfigure) return null;

        // Acciones no implementadas en esta fase (solo GET).
        // Mantenemos la columna por consistencia visual, sin mocks ni side-effects.
        return <span className="text-text-muted">-</span>;
      }
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Dispositivos</h1>
            <p className="text-text-muted mt-1">Gestión de dispositivos telemáticos</p>
          </div>
        </div>
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-text-muted mt-4">Cargando dispositivos...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Dispositivos</h1>
            <p className="text-text-muted mt-1">Gestión de dispositivos telemáticos</p>
          </div>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-error mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Error al cargar dispositivos</h3>
            <p className="text-text-muted mb-6 text-center max-w-md">{error}</p>
            <Button onClick={loadDevices}>Reintentar</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Empty state
  if (devices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Dispositivos</h1>
            <p className="text-text-muted mt-1">Gestión de dispositivos telemáticos</p>
          </div>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <Settings size={48} className="text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Sin dispositivos</h3>
            <p className="text-text-muted text-center max-w-md">
              No hay dispositivos registrados para tu organización.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Dispositivos</h1>
          <p className="text-text-muted mt-1">Gestión de dispositivos telemáticos</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <Wifi size={24} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {devices.filter(d => d.estado === 'online').length}
              </p>
              <p className="text-sm text-text-muted">Dispositivos Online</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-error/10">
              <WifiOff size={24} className="text-error" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {devices.filter(d => d.estado === 'offline').length}
              </p>
              <p className="text-sm text-text-muted">Dispositivos Offline</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Settings size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text">
                {devices.filter(d => d.estado !== 'online' && d.estado !== 'offline').length}
              </p>
              <p className="text-sm text-text-muted">Disponibles</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={devices}
          keyExtractor={(d) => d.id}
        />
      </Card>

      {/* Modal de asignación/configuración: fuera de alcance (solo GET). */}
    </div>
  );
}
