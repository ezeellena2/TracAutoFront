import { useState, useCallback, useEffect } from 'react';
import { Mail, RefreshCw, Trash2, Clock } from 'lucide-react';
import { Table, Badge, Button, Card, CardHeader, ConfirmationModal } from '@/shared/ui';
import { invitacionesApi } from '@/services/endpoints';
import { toast } from '@/store';

interface Invitacion {
  id: string;
  email: string;
  rolAsignado: string;
  estado: string;
  fechaCreacion: string;
  fechaExpiracion: string;
  token?: string;
}

export function PendingInvitationsTable() {
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invitationIdToCancel, setInvitationIdToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadInvitaciones = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await invitacionesApi.getInvitacionesPendientes();
      setInvitaciones(data);
    } catch (err) {
      console.error('Error loading invitations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitaciones();
  }, [loadInvitaciones]);

  const handleResend = async (id: string) => {
    try {
      await invitacionesApi.reenviarInvitacion(id);
      toast.success('Invitación reenviada correctamente');
    } catch (error) {
      toast.error('Error al reenviar invitación');
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
      toast.success('Invitación cancelada');
      setInvitationIdToCancel(null);
      loadInvitaciones();
    } catch (error) {
      toast.error('Error al cancelar invitación');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'email',
      header: 'Email',
      render: (i: Invitacion) => (
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-text-muted" />
          <span className="font-medium text-text">{i.email}</span>
        </div>
      )
    },
    {
      key: 'rolAsignado',
      header: 'Rol',
      render: (i: Invitacion) => <Badge>{i.rolAsignado}</Badge>
    },
    {
      key: 'fechaCreacion',
      header: 'Enviada',
      render: (i: Invitacion) => (
        <div className="flex items-center gap-1 text-text-muted">
          <Clock size={14} />
          {formatDate(i.fechaCreacion)}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (i: Invitacion) => (
        <div className="flex gap-2">
            <Button
            variant="ghost"
            size="sm"
            onClick={() => handleResend(i.id)}
            title="Reenviar"
            >
            <RefreshCw size={16} className="text-primary" />
            </Button>
            <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmCancel(i.id)}
            title="Cancelar"
            >
            <Trash2 size={16} className="text-error" />
            </Button>
        </div>
      )
    }
  ];

  if (invitaciones.length === 0 && !isLoading) return null;

  return (
    <>
      <Card className="mt-8 overflow-visible" padding="none">
          <CardHeader title="Invitaciones Pendientes" className="p-4 border-b border-border mb-0" />
          <Table
              columns={columns}
              data={invitaciones}
              keyExtractor={(i) => i.id}
              containerClassName="overflow-visible"
              isLoading={isLoading}
          />
      </Card>

      <ConfirmationModal
        isOpen={!!invitationIdToCancel}
        onClose={() => setInvitationIdToCancel(null)}
        onConfirm={handleCancel}
        title="Cancelar Invitación"
        description="¿Estás seguro de que deseas cancelar esta invitación? El enlace enviado dejará de ser válido."
        confirmText="Sí, cancelar"
        variant="danger"
        isLoading={isCancelling}
      />
    </>
  );
}
