import { useTranslation } from 'react-i18next';
import { Check, X, UserX, LogOut, LogIn } from 'lucide-react';
import { Card, CardHeader, Badge, Button } from '@/shared/ui';
import { EstadoReserva } from '../types/reserva';

interface EstadoAccionesCardProps {
  estado: number;
  onConfirmar: () => void;
  onCancelar: () => void;
  onNoShow: () => void;
  onCheckOut: () => void;
  onCheckIn: () => void;
  isConfirming: boolean;
  isCancelling: boolean;
  isMarkingNoShow: boolean;
  puedeEditar: boolean;
}

const ESTADO_BADGE_VARIANT: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [EstadoReserva.Tentativa]: 'warning',
  [EstadoReserva.Confirmada]: 'info',
  [EstadoReserva.EnCurso]: 'success',
  [EstadoReserva.Completada]: 'default',
  [EstadoReserva.Cancelada]: 'error',
  [EstadoReserva.NoShow]: 'error',
};

const esTerminal = (estado: number) =>
  estado === EstadoReserva.Completada ||
  estado === EstadoReserva.Cancelada ||
  estado === EstadoReserva.NoShow;

export function EstadoAccionesCard({
  estado,
  onConfirmar,
  onCancelar,
  onNoShow,
  onCheckOut,
  onCheckIn,
  isConfirming,
  isCancelling,
  isMarkingNoShow,
  puedeEditar,
}: EstadoAccionesCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader title={t('alquileres.reservaDetalle.acciones.titulo')} />

      {/* Estado prominente */}
      <div className="flex justify-center mb-4">
        <Badge variant={ESTADO_BADGE_VARIANT[estado] ?? 'default'}>
          {t(`alquileres.reservas.estados.${estado}`)}
        </Badge>
      </div>

      {esTerminal(estado) ? (
        <p className="text-sm text-text-muted text-center">
          {t('alquileres.reservaDetalle.acciones.estadoTerminal')}
        </p>
      ) : puedeEditar ? (
        <div className="space-y-2">
          {/* Tentativa → Confirmar */}
          {estado === EstadoReserva.Tentativa && (
            <Button
              variant="primary"
              onClick={onConfirmar}
              disabled={isConfirming}
              className="w-full"
            >
              <Check size={14} className="mr-1.5" />
              {t('alquileres.reservaDetalle.acciones.confirmar')}
            </Button>
          )}

          {/* Confirmada → Check-Out */}
          {estado === EstadoReserva.Confirmada && (
            <Button
              variant="primary"
              onClick={onCheckOut}
              className="w-full"
            >
              <LogOut size={14} className="mr-1.5" />
              {t('alquileres.reservaDetalle.acciones.checkOut')}
            </Button>
          )}

          {/* EnCurso → Check-In */}
          {estado === EstadoReserva.EnCurso && (
            <Button
              variant="primary"
              onClick={onCheckIn}
              className="w-full"
            >
              <LogIn size={14} className="mr-1.5" />
              {t('alquileres.reservaDetalle.acciones.checkIn')}
            </Button>
          )}

          {/* Tentativa/Confirmada → Cancelar */}
          {(estado === EstadoReserva.Tentativa || estado === EstadoReserva.Confirmada) && (
            <Button
              variant="danger"
              onClick={onCancelar}
              disabled={isCancelling}
              className="w-full"
            >
              <X size={14} className="mr-1.5" />
              {t('alquileres.reservaDetalle.acciones.cancelar')}
            </Button>
          )}

          {/* Confirmada → No Show */}
          {estado === EstadoReserva.Confirmada && (
            <Button
              variant="ghost"
              onClick={onNoShow}
              disabled={isMarkingNoShow}
              className="w-full text-error"
            >
              <UserX size={14} className="mr-1.5" />
              {t('alquileres.reservaDetalle.acciones.noShow')}
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  );
}
