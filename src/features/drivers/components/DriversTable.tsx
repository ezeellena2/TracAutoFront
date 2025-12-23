import { Edit, Trash2, Car, Smartphone, List } from 'lucide-react';
import { Table, Badge, ActionMenu } from '@/shared/ui';
import type { ConductorDto } from '../types';

interface DriversTableProps {
  conductores: ConductorDto[];
  canEdit: boolean;
  canDelete: boolean;
  actionMenuOpen: string | null;
  onActionMenuToggle: (id: string | null) => void;
  onEdit: (conductor: ConductorDto) => void;
  onViewAssignments: (conductor: ConductorDto) => void;
  onAssignVehicle: (conductor: ConductorDto) => void;
  onAssignDevice: (conductor: ConductorDto) => void;
  onDelete: (conductor: ConductorDto) => void;
  formatDate: (dateStr: string) => string;
}

export function DriversTable({
  conductores,
  canEdit,
  canDelete,
  actionMenuOpen,
  onActionMenuToggle,
  onEdit,
  onViewAssignments,
  onAssignVehicle,
  onAssignDevice,
  onDelete,
  formatDate,
}: DriversTableProps) {
  const columns = [
    {
      key: 'nombreCompleto',
      header: 'Nombre Completo',
      render: (c: ConductorDto) => (
        <div className="font-medium text-text">{c.nombreCompleto}</div>
      ),
    },
    {
      key: 'dni',
      header: 'DNI',
      render: (c: ConductorDto) => c.dni || '-',
    },
    {
      key: 'email',
      header: 'Email',
      render: (c: ConductorDto) => c.email || '-',
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (c: ConductorDto) => c.telefono || '-',
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (c: ConductorDto) => (
        <Badge variant={c.activo ? 'success' : 'error'}>
          {c.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'asignaciones',
      header: 'Asignaciones',
      render: () => (
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Car size={14} />
          <Smartphone size={14} />
          <span className="text-xs">Ver en acciones</span>
        </div>
      ),
    },
    {
      key: 'fechaCreacion',
      header: 'Creado',
      render: (c: ConductorDto) => formatDate(c.fechaCreacion),
    },
    {
      key: 'actions',
      header: '',
      render: (c: ConductorDto) => {
        if (!canEdit && !canDelete) return null;

        const isOpen = actionMenuOpen === c.id;

        return (
          <ActionMenu
            isOpen={isOpen}
            onToggle={() => onActionMenuToggle(isOpen ? null : c.id)}
            onClose={() => onActionMenuToggle(null)}
          >
            <div className="flex flex-col">
              {canEdit && (
                <>
                  <button
                    onClick={() => {
                      onActionMenuToggle(null);
                      onEdit(c);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2 text-text"
                  >
                    <Edit size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      onActionMenuToggle(null);
                      onViewAssignments(c);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2 text-text"
                  >
                    <List size={14} />
                    Ver Asignaciones
                  </button>
                  <div className="px-3 py-2 text-xs font-medium text-text-muted border-b border-border">
                    Asignar
                  </div>
                  <button
                    onClick={() => {
                      onActionMenuToggle(null);
                      onAssignVehicle(c);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2 text-text"
                  >
                    <Car size={14} />
                    Asignar Vehículo
                  </button>
                  <button
                    onClick={() => {
                      onActionMenuToggle(null);
                      onAssignDevice(c);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2 text-text"
                  >
                    <Smartphone size={14} />
                    Asignar Dispositivo
                  </button>
                </>
              )}
              {canDelete && (
                <>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => {
                      onActionMenuToggle(null);
                      onDelete(c);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </ActionMenu>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={conductores}
      keyExtractor={(c) => c.id}
      containerClassName="overflow-visible"
    />
  );
}

