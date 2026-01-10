import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Car, Smartphone, List, RefreshCw, Share2 } from 'lucide-react';
import { Table, Badge, ActionMenu } from '@/shared/ui';
import { NivelPermisoCompartido } from '@/shared/types/api';
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
  onReactivate: (conductor: ConductorDto) => void;
  onShare?: (conductor: ConductorDto) => void;
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
  onReactivate,
  onShare,
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
      key: 'compartidoCon',
      header: t('drivers.sharing'),
      render: (c: ConductorDto) => {
        // Si es recurso asociado, mostrar badge indicando que viene de otra org
        if (c.esRecursoAsociado) {
          return (
            <div className="flex flex-col gap-1 items-start">
              <Badge variant="warning">
                {t('drivers.table.associated')}
              </Badge>
              {c.permisoAcceso === NivelPermisoCompartido.GestionOperativa ? (
                <Badge variant="success">{t('permissions.operational')}</Badge>
              ) : (
                <Badge variant="default">{t('permissions.readOnly')}</Badge>
              )}
            </div>
          );
        }
        // Si está compartido con otras organizaciones
        if (c.compartidoCon?.estaCompartido) {
          const { cantidadOrganizaciones, organizaciones } = c.compartidoCon;
          const nombresOrgs = organizaciones.map(o => o.nombre).join(', ');
          const titulo = cantidadOrganizaciones > 3
            ? `${nombresOrgs} (+${cantidadOrganizaciones - 3} ${t('common.more')})`
            : nombresOrgs;
          return (
            <button
              onClick={() => onShare?.(c)}
              title={titulo}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Share2 size={14} className="text-primary" />
              <Badge variant="info">
                {cantidadOrganizaciones}
              </Badge>
            </button>
          );
        }
        // No compartido - clickeable para abrir modal
        return (
          <button
            onClick={() => onShare?.(c)}
            className="text-text-muted hover:text-primary transition-colors cursor-pointer"
            title={t('drivers.table.manageSharing')}
          >
            —
          </button>
        );
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
        const isActive = c.activo;

        return (
          <ActionMenu
            isOpen={isOpen}
            onToggle={() => onActionMenuToggle(isOpen ? null : c.id)}
            onClose={() => onActionMenuToggle(null)}
          >
            <div className="flex flex-col">
              {/* Conductor ACTIVO: mostrar todas las acciones normales */}
              {isActive && canEdit && (
                <>

                  {!c.esRecursoAsociado && (
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
                  )}
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
                  {!c.esRecursoAsociado && onShare && (
                    <button
                      onClick={() => {
                        onActionMenuToggle(null);
                        onShare(c);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2 text-primary"
                    >
                      <Share2 size={14} />
                      {t('drivers.manageSharing')}
                    </button>
                  )}
                  <div className="px-3 py-2 text-xs font-medium text-text-muted border-b border-border">
                    {t('drivers.assign')}
                  </div>
                  {(!c.esRecursoAsociado || c.permisoAcceso === NivelPermisoCompartido.GestionOperativa) && (
                    <>
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
                </>
              )}

              {/* Conductor ACTIVO: mostrar eliminar (solo propios) */}
                  {isActive && canDelete && !c.esRecursoAsociado && (
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
                  {/* Conductor INACTIVO: solo mostrar Reactivar */}
                  {!isActive && canEdit && (
                    <button
                      onClick={() => {
                        onActionMenuToggle(null);
                        onReactivate(c);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                    >
                      <RefreshCw size={14} />
                      {t('drivers.reactivate')}
                    </button>
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
