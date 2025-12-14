import { useState } from 'react';
import { Wifi, WifiOff, Link2, Link2Off, Settings } from 'lucide-react';
import { Card, CardHeader, Table, Badge, Button, Modal } from '@/shared/ui';
import { mockDevices, mockVehicles } from '@/services/mock';

interface Device {
  id: string;
  modelo: string;
  tipo: string;
  imei: string;
  estado: string;
  vehicleId: string | null;
  ultimoPing: string | null;
  firmware: string;
}

export function DevicesPage() {
  const [devices] = useState(mockDevices);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const availableVehicles = mockVehicles.filter(v => !v.deviceId);

  const getVehiclePatente = (vehicleId: string | null) => {
    if (!vehicleId) return null;
    const vehicle = mockVehicles.find(v => v.id === vehicleId);
    return vehicle?.patente;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'online': return <Badge variant="success">Online</Badge>;
      case 'offline': return <Badge variant="error">Offline</Badge>;
      case 'disponible': return <Badge variant="info">Disponible</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  const handleAssign = async (vehicleId: string) => {
    setIsLoading(true);
    // Simular operación
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    setIsAssignModalOpen(false);
    alert('Dispositivo asignado correctamente (mock)');
  };

  const handleUnassign = async (device: Device) => {
    if (!confirm('¿Desea desasignar este dispositivo del vehículo?')) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    alert('Dispositivo desasignado correctamente (mock)');
  };

  const columns = [
    { key: 'modelo', header: 'Modelo', sortable: true },
    { key: 'tipo', header: 'Tipo' },
    { key: 'imei', header: 'IMEI' },
    {
      key: 'estado',
      header: 'Estado',
      render: (d: Device) => getEstadoBadge(d.estado)
    },
    {
      key: 'vehicleId',
      header: 'Vehículo',
      render: (d: Device) => {
        const patente = getVehiclePatente(d.vehicleId);
        return patente ? (
          <Badge variant="info">{patente}</Badge>
        ) : (
          <span className="text-text-muted">-</span>
        );
      }
    },
    {
      key: 'ultimoPing',
      header: 'Último Ping',
      render: (d: Device) => formatDate(d.ultimoPing)
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (d: Device) => (
        <div className="flex items-center gap-2">
          {d.vehicleId ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUnassign(d);
              }}
            >
              <Link2Off size={16} className="text-error" />
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDevice(d);
                setIsAssignModalOpen(true);
              }}
            >
              <Link2 size={16} className="text-success" />
            </Button>
          )}
        </div>
      )
    },
  ];

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
                {devices.filter(d => d.estado === 'disponible').length}
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

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Asignar Dispositivo"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Seleccione un vehículo para asignar el dispositivo <strong>{selectedDevice?.modelo}</strong>
          </p>
          
          {availableVehicles.length === 0 ? (
            <p className="text-center text-text-muted py-4">
              No hay vehículos disponibles
            </p>
          ) : (
            <div className="space-y-2">
              {availableVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => handleAssign(vehicle.id)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div>
                    <p className="font-semibold text-text">{vehicle.patente}</p>
                    <p className="text-sm text-text-muted">
                      {vehicle.marca} {vehicle.modelo}
                    </p>
                  </div>
                  <Link2 size={20} className="text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
