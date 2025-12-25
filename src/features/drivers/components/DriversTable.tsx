import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const columns = [
    {
      key: 'nombreCompleto',
      header: t('drivers.fullName'),
      render: (c: ConductorDto) => (
        <div className="font-medium text-text">{c.nombreCompleto}</div>
      ),
    },
    {
      key: 'dni',
      header: t('drivers.dni'),
      render: (c: ConductorDto) => c.dni || '-',
    },
    {
      key: 'email',
      header: t('drivers.email'),
      render: (c: ConductorDto) => c.email || '-',
    },
    {
      key: 'telefono',
      header: t('drivers.phone'),
      render: (c: ConductorDto) => c.telefono || '-',
    },
    {
      key: 'activo',
      header: t('drivers.status'),
      render: (c: ConductorDto) => (
        <Badge variant={c.activo ? 'success' : 'error'}>
          {c.activo ? t('drivers.active') : t('drivers.inactive')}
        </Badge>
      ),
    },
    {
      key: 'organizacionAsociada',
      header: t('drivers.associatedOrganization'),
      render: (c: ConductorDto) => {
        if (c.organizacionAsociadaNombre) {
          return (
            <div className="flex items-center gap-2">
              <Badge variant="info">{c.organizacionAsociadaNombre}</Badge>
              {c.esRecursoAsociado && (
                <span className="text-xs text-text-muted">({t('drivers.sharedResource')})</span>
              )}
            </div>
          );
        }
        return <span className="text-text-muted">-</span>;
      },
    },
    {
      key: 'asignaciones',
      header: t('drivers.assignments'),
      render: () => (
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Car size={14} />
          <Smartphone size={14} />
          <span className="text-xs">{t('drivers.seeInActions')}</span>
        </div>
      ),
    },
    {
      key: 'fechaCreacion',
      header: t('drivers.created'),
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
                    {t('drivers.edit')}
                  </button>
                  <button
                    onClick={() => {
                      onActionMenuToggle(null);
                      onViewAssignments(c);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2 text-text"
                  >
                    <List size={14} />
                    {t('drivers.viewAssignments')}
                  </button>
                  <div className="px-3 py-2 text-xs font-medium text-text-muted border-b border-border">
                    {t('drivers.assign')}
                  </div>
                  <button
                    onClick={() => {
                      onActionMenuToggle(null);
                      onAssignVehicle(c);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2 text-text"
                  >
                    <Car size={14} />
                    {t('drivers.assignVehicle')}
                  </button>
                  <button
                    onClick={() => {
                      onActionMenuToggle(null);
                      onAssignDevice(c);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2 text-text"
                  >
                    <Smartphone size={14} />
                    {t('drivers.assignDevice')}
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
                    {t('drivers.delete')}
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
