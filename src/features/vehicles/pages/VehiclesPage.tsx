import { useState } from 'react';
import { Search, Filter, Eye, MapPin, Plus } from 'lucide-react';
import { Card, Table, Badge, Button, Input, Modal, PermissionGate } from '@/shared/ui';
import { mockVehicles } from '@/services/mock';
import { usePermissions } from '@/hooks';

interface Vehicle {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  estado: string;
  deviceId: string | null;
  ultimaUbicacion: string;
  ultimaConexion: string;
}

export function VehiclesPage() {
  const [vehicles] = useState(mockVehicles);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { can } = usePermissions();

  // Permisos
  const canEdit = can('vehiculos:editar');
  const canDelete = can('vehiculos:eliminar');

  const filteredVehicles = vehicles.filter(v => 
    v.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    { key: 'patente', header: 'Patente', sortable: true },
    { 
      key: 'vehiculo', 
      header: 'Vehículo',
      render: (v: Vehicle) => `${v.marca} ${v.modelo} (${v.anio})`
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (v: Vehicle) => (
        <Badge variant={v.estado === 'activo' ? 'success' : 'warning'}>
          {v.estado}
        </Badge>
      )
    },
    {
      key: 'deviceId',
      header: 'Dispositivo',
      render: (v: Vehicle) => v.deviceId ? (
        <Badge variant="info">{v.deviceId}</Badge>
      ) : (
        <span className="text-text-muted">Sin asignar</span>
      )
    },
    {
      key: 'ultimaUbicacion',
      header: 'Ubicación',
      render: (v: Vehicle) => (
        <div className="flex items-center gap-1">
          <MapPin size={14} className="text-text-muted" />
          {v.ultimaUbicacion}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (v: Vehicle) => (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(v);
            }}
          >
            <Eye size={16} />
          </Button>
          {/* Botones adicionales solo visibles con permisos */}
          {canEdit && (
            <Button variant="ghost" size="sm" title="Editar">
              ✏️
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" title="Eliminar" className="text-red-500">
              🗑️
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
          <h1 className="text-2xl font-bold text-text">Vehículos</h1>
          <p className="text-text-muted mt-1">Gestión de vehículos asegurados</p>
        </div>
        <PermissionGate permission="vehiculos:crear">
          <Button>
            <Plus size={18} className="mr-2" />
            Agregar Vehículo
          </Button>
        </PermissionGate>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Buscar por patente, marca o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter size={16} className="mr-2" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={filteredVehicles}
          keyExtractor={(v) => v.id}
          onRowClick={handleViewDetails}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detalle del Vehículo"
        size="lg"
      >
        {selectedVehicle && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-muted">Patente</p>
                <p className="font-semibold text-text">{selectedVehicle.patente}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Vehículo</p>
                <p className="font-semibold text-text">
                  {selectedVehicle.marca} {selectedVehicle.modelo} ({selectedVehicle.anio})
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Estado</p>
                <Badge variant={selectedVehicle.estado === 'activo' ? 'success' : 'warning'}>
                  {selectedVehicle.estado}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-text-muted">Dispositivo</p>
                <p className="font-semibold text-text">
                  {selectedVehicle.deviceId || 'Sin asignar'}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Última Ubicación</p>
                <p className="font-semibold text-text">{selectedVehicle.ultimaUbicacion}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Última Conexión</p>
                <p className="font-semibold text-text">
                  {formatDate(selectedVehicle.ultimaConexion)}
                </p>
              </div>
            </div>

            <div className="h-48 bg-background rounded-lg flex items-center justify-center text-text-muted">
              <MapPin size={24} className="mr-2" />
              Mapa (próximamente)
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
