/**
 * Tabla de geofences con acciones CRUD.
 * Sigue el mismo patrón que DriversTable (ActionMenu dropdown).
 */

import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Link } from 'lucide-react';
import { Table, Badge, ActionMenu } from '@/shared/ui';
import { SyncStatusBadge } from './SyncStatusBadge';
import { TipoGeofence } from '../types';
import type { GeofenceDto } from '../types';

interface GeofencesTableProps {
  geofences: GeofenceDto[];
  canEdit: boolean;
  canDelete: boolean;
  actionMenuOpen: string | null;
  onActionMenuToggle: (id: string | null) => void;
  onEdit: (geofence: GeofenceDto) => void;
  onDelete: (geofence: GeofenceDto) => void;
  onAssignVehiculos: (geofence: GeofenceDto) => void;
  formatDate: (dateStr: string) => string;
}

const TIPO_LABELS: Record<TipoGeofence, string> = {
  [TipoGeofence.Polygon]: 'geofences.tipo.polygon',
  [TipoGeofence.Circle]: 'geofences.tipo.circle',
  [TipoGeofence.Polyline]: 'geofences.tipo.polyline',
};

export function GeofencesTable({
  geofences,
  canEdit,
  canDelete,
  actionMenuOpen,
  onActionMenuToggle,
  onEdit,
  onDelete,
  onAssignVehiculos,
  formatDate,
}: GeofencesTableProps) {
  const { t } = useTranslation();

  const columns = [
    {
      key: 'nombre',
      header: t('geofences.nombre'),
      render: (g: GeofenceDto) => (
        <div>
          <div className="font-medium text-text">{g.nombre}</div>
          {g.descripcion && (
            <div className="text-xs text-text-muted mt-0.5 line-clamp-1">
              {g.descripcion}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'tipo',
      header: t('geofences.tipo.label'),
      render: (g: GeofenceDto) => (
        <Badge variant="info" size="sm">
          {t(TIPO_LABELS[g.tipo] ?? 'geofences.tipo.polygon')}
        </Badge>
      ),
    },
    {
      key: 'syncStatus',
      header: t('geofences.syncStatus'),
      render: (g: GeofenceDto) => <SyncStatusBadge status={g.syncStatus} />,
    },
    {
      key: 'fechaCreacion',
      header: t('geofences.fechaCreacion'),
      render: (g: GeofenceDto) => (
        <span className="text-sm text-text-muted">
          {formatDate(g.fechaCreacion)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (g: GeofenceDto) => {
        if (!canEdit && !canDelete) return null;

        const isOpen = actionMenuOpen === g.id;

        return (
          <ActionMenu
            isOpen={isOpen}
            onToggle={() => onActionMenuToggle(isOpen ? null : g.id)}
            onClose={() => onActionMenuToggle(null)}
          >
            <div className="flex flex-col">
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onActionMenuToggle(null);
                      onEdit(g);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2 text-text"
                    data-cr-key="geofences-table-acciones-editar"
                    data-route="/geozonas"
                    data-label="Tabla de Geozonas - Botón Editar"
                    data-entity-type="Geofence"
                    data-entity-id={g.id}
                  >
                    <Pencil size={14} />
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onActionMenuToggle(null);
                      onAssignVehiculos(g);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-surface flex items-center gap-2 text-text"
                  >
                    <Link size={14} />
                    {t('geofences.asignarVehiculos')}
                  </button>
                </>
              )}
              {canDelete && (
                <>
                  <div className="border-t border-border my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      onActionMenuToggle(null);
                      onDelete(g);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    {t('common.delete')}
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
    <Table<GeofenceDto>
      columns={columns}
      data={geofences}
      keyExtractor={(g) => g.id}
      containerClassName="overflow-visible"
    />
  );
}
