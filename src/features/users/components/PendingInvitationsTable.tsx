import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, RefreshCw, Trash2, Clock, AlertCircle, Ban, CheckCircle, Hourglass } from 'lucide-react';
import { Table, Badge, Button, Card, CardHeader, PaginationControls } from '@/shared/ui';
import { ConfirmationModal } from '@/shared/ui/ConfirmationModal';
import { invitacionesApi } from '@/services/endpoints';
import { usePaginationParams, useErrorHandler, useLocalization } from '@/hooks';
import { toast } from '@/store';
import { ListaPaginada, InvitacionDto } from '@/shared/types/api';
import { formatDateTime } from '@/shared/utils';

export function PendingInvitationsTable() {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();
  const { handleApiError } = useErrorHandler();
  // Datos paginados
  const [invitacionesData, setInvitacionesData] = useState<ListaPaginada<InvitacionDto> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invitationIdToCancel, setInvitationIdToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Hook de paginación reutilizable
  const {
    setNumeroPagina,
    setTamanoPagina,
    params: paginationParams
  } = usePaginationParams({ initialPageSize: 10 });

  const loadInvitaciones = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const result = await invitacionesApi.getInvitacionesPendientes(paginationParams);
      setInvitacionesData(result);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error loading invitations:', err);
      const parsed = handleApiError(err, { showToast: false });
      setLoadError(parsed.message);
    } finally {
      setIsLoading(false);
    }
  }, [paginationParams, handleApiError]);

  useEffect(() => {
    loadInvitaciones();
  }, [loadInvitaciones]);

  const handleResend = async (id: string) => {
    try {
      setResendingId(id);
      await invitacionesApi.reenviarInvitacion(id);
      toast.success(t('users.success.resendInvitation'));
      await loadInvitaciones();
    } catch (error) {
      handleApiError(error);
    } finally {
      setResendingId(null);
    }
  };

  const confirmCancel = (id: string) => {
    setInvitationIdToCancel(id);
  };

  const handleCancel = async () => {
    if (!invitationIdToCancel) return;
    try {
      setIsCancelling(true);
      await invitacionesApi.cancelInvitacion(invitationIdToCancel);
      toast.success(t('users.success.cancelInvitation'));
      setInvitationIdToCancel(null);
      loadInvitaciones();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsCancelling(false);
    }
  };

  // Extraer items para la tabla
  const invitaciones = invitacionesData?.items ?? [];

  const columns = [
    {
      key: 'email',
      header: t('users.email'),
      render: (i: InvitacionDto) => (
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-text-muted" />
          <span className="font-medium text-text">{i.email}</span>
        </div>
      )
    },
    {
      key: 'estado',
      header: t('users.status'),
      render: (i: InvitacionDto) => {
        const estado = (i.estado ?? '').toLowerCase();
        if (estado === 'cancelada') return (
          <div className="flex items-center gap-1 text-error">
            <Ban size={14} />
            <span className="text-sm font-medium">{t('users.statuses.cancelled')}</span>
          </div>
        );
        if (estado === 'aceptada') return (
          <div className="flex items-center gap-1 text-success">
            <CheckCircle size={14} />
            <span className="text-sm font-medium">{t('users.statuses.accepted')}</span>
          </div>
        );
        return (
          <div className="flex items-center gap-1 text-warning">
            <Hourglass size={14} />
            <span className="text-sm font-medium">{t('users.statuses.pending')}</span>
          </div>
        );
      }
    },
    {
      key: 'rolAsignado',
      header: t('users.role'),
      render: (i: InvitacionDto) => <Badge>{i.rolAsignado}</Badge>
    },
    {
      key: 'fechaCreacion',
      header: t('users.sent'),
      render: (i: InvitacionDto) => (
        <div className="flex items-center gap-1 text-text-muted">
          <Clock size={14} />
          {formatDateTime(i.fechaCreacion, culture, timeZoneId)}
        </div>
      )
    },
    {
      key: 'fechaExpiracion',
      header: t('users.expires'),
      render: (i: InvitacionDto) => (
        <div className="flex items-center gap-1 text-text-muted">
          <AlertCircle size={14} />
          <span className={
            i.fechaExpiracion && new Date(i.fechaExpiracion) < new Date()
              ? 'text-error font-medium'
              : ''
          }>
            {i.fechaExpiracion
              ? formatDateTime(i.fechaExpiracion, culture, timeZoneId)
              : '-'}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: t('users.actions'),
      render: (i: InvitacionDto) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleResend(i.id)}
            disabled={resendingId === i.id}
            title={t('users.resendInvitation')}
          >
            {resendingId === i.id ? (
              <RefreshCw size={16} className="text-primary animate-spin" />
            ) : (
              <RefreshCw size={16} className="text-primary" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmCancel(i.id)}
            title={t('users.cancelInvitation')}
          >
            <Trash2 size={16} className="text-error" />
          </Button>
        </div>
      )
    }
  ];

  // No mostrar si no hay invitaciones y no está cargando
  if (invitaciones.length === 0 && !isLoading && !loadError) return null;

  return (
    <>
      <Card className="mt-8 overflow-visible" padding="none">
        <CardHeader title={t('users.pendingInvitations')} className="p-4 border-b border-border mb-0" />
        {isLoading ? (
          <div className="p-8 text-center text-text-muted">
            {t('users.loadingInvitations')}
          </div>
        ) : loadError ? (
          <div className="p-8 text-center">
            <p className="text-error mb-3">{loadError}</p>
            <Button variant="outline" size="sm" onClick={loadInvitaciones}>
              {t('common.retry')}
            </Button>
          </div>
        ) : (
          <>
            <Table
              columns={columns}
              data={invitaciones}
              keyExtractor={(i) => i.id}
              containerClassName="overflow-visible"
            />
            {/* Controles de paginación */}
            {invitacionesData && invitacionesData.totalRegistros > 0 && (
              <PaginationControls
                paginaActual={invitacionesData.paginaActual}
                totalPaginas={invitacionesData.totalPaginas}
                tamanoPagina={invitacionesData.tamanoPagina}
                totalRegistros={invitacionesData.totalRegistros}
                onPageChange={setNumeroPagina}
                onPageSizeChange={setTamanoPagina}
                disabled={isLoading}
              />
            )}
          </>
        )}
      </Card>

      <ConfirmationModal
        isOpen={!!invitationIdToCancel}
        onClose={() => setInvitationIdToCancel(null)}
        onConfirm={handleCancel}
        title={t('users.cancelInvitation')}
        description={t('users.confirmCancelInvitation')}
        confirmText={t('users.yesCancel')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isCancelling}
      />
    </>
  );
}
