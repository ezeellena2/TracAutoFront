import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { Table, Badge, ActionMenu, ConfirmationModal } from '@/shared/ui';
import { OrganizacionRelacionDto } from '@/shared/types/api';
import { formatDateTime } from '@/shared/utils';
import { useLocalization } from '@/hooks';

interface RelacionesTableProps {
  relaciones: OrganizacionRelacionDto[];
  organizacionActualId: string;
  onDelete: (relacionId: string) => void;
  actionMenuOpen: string | null;
  setActionMenuOpen: (id: string | null) => void;
  relacionToDelete: string | null;
  setRelacionToDelete: (id: string | null) => void;
  isDeleting: boolean;
}

export function RelacionesTable({
  relaciones,
  organizacionActualId,
  onDelete,
  actionMenuOpen,
  setActionMenuOpen,
  relacionToDelete,
  setRelacionToDelete,
  isDeleting,
}: RelacionesTableProps) {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();

  const columns = [
    {
      key: 'organizacion',
      header: t('organization.relations.table.organization'),
      render: (relacion: OrganizacionRelacionDto) => {
        // Determinar qué organización mostrar (la otra, no la actual)
        const otraOrgNombre = relacion.organizacionAId === organizacionActualId
          ? relacion.organizacionBNombre
          : relacion.organizacionANombre;
        
        return (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {otraOrgNombre.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium">{otraOrgNombre}</span>
          </div>
        );
      },
    },
    {
      key: 'tipoRelacion',
      header: t('organization.relations.table.relationType'),
      render: (relacion: OrganizacionRelacionDto) => (
        <span className="text-text-muted">
          {relacion.tipoRelacion || t('organization.relations.table.noType')}
        </span>
      ),
    },
    {
      key: 'estado',
      header: t('organization.relations.table.status'),
      render: (relacion: OrganizacionRelacionDto) => (
        <Badge variant={relacion.activa ? 'success' : 'default'}>
          {relacion.activa ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      key: 'fechaCreacion',
      header: t('organization.relations.table.createdDate'),
      render: (relacion: OrganizacionRelacionDto) => (
        <span className="text-text-muted text-sm">
          {formatDateTime(relacion.fechaCreacion, culture, timeZoneId)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (relacion: OrganizacionRelacionDto) => {
        const isOpen = actionMenuOpen === relacion.id;
        return (
          <ActionMenu
            isOpen={isOpen}
            onToggle={() => setActionMenuOpen(isOpen ? null : relacion.id)}
            onClose={() => setActionMenuOpen(null)}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              onClick={() => {
                setActionMenuOpen(null);
                if (relacion.activa) {
                  setRelacionToDelete(relacion.id);
                }
              }}
              disabled={!relacion.activa}
            >
              <Trash2 size={14} />
              {t('organization.relations.actions.delete')}
            </button>
          </ActionMenu>
        );
      },
    },
  ];

  return (
    <>
      <Table 
        columns={columns} 
        data={relaciones}
        keyExtractor={(r) => r.id}
      />
      
      <ConfirmationModal
        isOpen={relacionToDelete !== null}
        onClose={() => setRelacionToDelete(null)}
        onConfirm={() => {
          if (relacionToDelete) {
            onDelete(relacionToDelete);
          }
        }}
        title={t('organization.relations.delete.title')}
        description={t('organization.relations.delete.message')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}

