import { useTranslation } from 'react-i18next';
import { Eye, ExternalLink, Trash2 } from 'lucide-react';
import { Table, Badge, ActionMenu } from '@/shared/ui';
import { SolicitudCambioDto, EstadoSolicitudCambio } from '@/shared/types/api';
import { formatDateTime } from '@/shared/utils';
import { useLocalization } from '@/hooks';

interface SolicitudesCambioTableProps {
  solicitudes: SolicitudCambioDto[];
  isLoading?: boolean;
  onViewDetails?: (solicitud: SolicitudCambioDto) => void;
  onDelete?: (solicitud: SolicitudCambioDto) => void;
  actionMenuOpen: string | null;
  setActionMenuOpen: (id: string | null) => void;
}

const ESTADO_LABELS: Record<EstadoSolicitudCambio, string> = {
  [EstadoSolicitudCambio.Draft]: 'solicitudesCambio.estados.draft',
  [EstadoSolicitudCambio.NeedsInfo]: 'solicitudesCambio.estados.needsInfo',
  [EstadoSolicitudCambio.Ready]: 'solicitudesCambio.estados.ready',
  [EstadoSolicitudCambio.Submitted]: 'solicitudesCambio.estados.submitted',
  [EstadoSolicitudCambio.Exported]: 'solicitudesCambio.estados.exported',
  [EstadoSolicitudCambio.Failed]: 'solicitudesCambio.estados.failed',
};

const ESTADO_VARIANTS: Record<EstadoSolicitudCambio, 'default' | 'warning' | 'success' | 'error'> = {
  [EstadoSolicitudCambio.Draft]: 'default',    // Draft
  [EstadoSolicitudCambio.NeedsInfo]: 'warning',    // NeedsInfo
  [EstadoSolicitudCambio.Ready]: 'success',    // Ready
  [EstadoSolicitudCambio.Submitted]: 'default',    // Submitted
  [EstadoSolicitudCambio.Exported]: 'success',    // Exported
  [EstadoSolicitudCambio.Failed]: 'error',      // Failed
};

export function SolicitudesCambioTable({
  solicitudes,
  isLoading,
  onViewDetails,
  onDelete,
  actionMenuOpen,
  setActionMenuOpen,
}: SolicitudesCambioTableProps) {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();

  const columns = [
    {
      key: 'estado',
      header: t('solicitudesCambio.table.estado'),
      render: (solicitud: SolicitudCambioDto) => (
        <Badge variant={ESTADO_VARIANTS[solicitud.estado]}>
          {t(ESTADO_LABELS[solicitud.estado])}
        </Badge>
      ),
    },
    {
      key: 'contexto',
      header: t('solicitudesCambio.table.contexto'),
      render: (solicitud: SolicitudCambioDto) => (
        <div className="flex flex-col gap-1">
          {solicitud.label && (
            <span className="font-medium text-text">{solicitud.label}</span>
          )}
          {solicitud.crKey && (
            <span className="text-xs text-text-muted">{solicitud.crKey}</span>
          )}
          {solicitud.route && (
            <span className="text-xs text-text-muted">{solicitud.route}</span>
          )}
        </div>
      ),
    },
    {
      key: 'fechaCreacion',
      header: t('solicitudesCambio.table.fechaCreacion'),
      render: (solicitud: SolicitudCambioDto) => (
        <span className="text-text-muted text-sm">
          {formatDateTime(solicitud.fechaCreacion, culture, timeZoneId)}
        </span>
      ),
    },
    {
      key: 'jiraIssue',
      header: t('solicitudesCambio.table.jiraIssue'),
      render: (solicitud: SolicitudCambioDto) => {
        if (solicitud.jiraIssueKey && solicitud.jiraIssueUrl) {
          return (
            <a
              href={solicitud.jiraIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {solicitud.jiraIssueKey}
              <ExternalLink size={14} />
            </a>
          );
        }
        return <span className="text-text-muted text-sm">-</span>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (solicitud: SolicitudCambioDto) => {
        const isOpen = actionMenuOpen === solicitud.id;
        return (
          <ActionMenu
            isOpen={isOpen}
            onToggle={() => setActionMenuOpen(isOpen ? null : solicitud.id)}
            onClose={() => setActionMenuOpen(null)}
          >
            {onViewDetails && (
              <button
                className="w-full px-3 py-2 text-left text-sm text-text hover:bg-background flex items-center gap-2"
                onClick={() => {
                  setActionMenuOpen(null);
                  onViewDetails(solicitud);
                }}
              >
                <Eye size={14} />
                {t('solicitudesCambio.actions.verDetalles')}
              </button>
            )}
            {onDelete && (
              <button
                className="w-full px-3 py-2 text-left text-sm text-error hover:bg-background flex items-center gap-2"
                onClick={() => {
                  setActionMenuOpen(null);
                  onDelete(solicitud);
                }}
              >
                <Trash2 size={14} />
                {t('solicitudesCambio.actions.borrar')}
              </button>
            )}
            {solicitud.jiraIssueUrl && (
              <a
                href={solicitud.jiraIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3 py-2 text-left text-sm text-text hover:bg-background flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setActionMenuOpen(null);
                }}
              >
                <ExternalLink size={14} />
                {t('solicitudesCambio.actions.abrirJira')}
              </a>
            )}
          </ActionMenu>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={solicitudes}
      keyExtractor={(s) => s.id}
      isLoading={isLoading}
      emptyMessage={t('solicitudesCambio.empty')}
    />
  );
}
