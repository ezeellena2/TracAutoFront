import { EstadoReserva } from '@/features/alquileres/types/reserva';

export const ESTADO_BADGE_VARIANT: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [EstadoReserva.Tentativa]: 'warning',
  [EstadoReserva.Confirmada]: 'info',
  [EstadoReserva.EnCurso]: 'success',
  [EstadoReserva.Completada]: 'success',
  [EstadoReserva.Cancelada]: 'error',
  [EstadoReserva.NoShow]: 'error',
};

export const ESTADO_LABEL_KEY: Record<number, string> = {
  [EstadoReserva.Tentativa]: 'alquileres.reservaDetalle.timeline.creada',
  [EstadoReserva.Confirmada]: 'alquileres.reservaDetalle.timeline.confirmada',
  [EstadoReserva.EnCurso]: 'alquileres.reservaDetalle.timeline.enCurso',
  [EstadoReserva.Completada]: 'alquileres.reservaDetalle.timeline.completada',
  [EstadoReserva.Cancelada]: 'alquileres.reservaDetalle.timeline.cancelada',
  [EstadoReserva.NoShow]: 'alquileres.reservaDetalle.timeline.noShow',
};
