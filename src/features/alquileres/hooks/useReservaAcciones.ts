import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reservasApi, contratosApi, pagosAlquilerApi } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { RegistrarPagoManualRequest } from '../types/reserva';
import { RESERVA_QUERY_KEY } from './useReservaData';

export function useReservaAcciones(id: string) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  // ───── Modal state ─────

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isNoShowOpen, setIsNoShowOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isPagoOpen, setIsPagoOpen] = useState(false);

  // ───── Invalidation helper ─────

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [RESERVA_QUERY_KEY, id] });
    queryClient.invalidateQueries({ queryKey: ['reservas'] });
  }, [queryClient, id]);

  // ───── Mutations ─────

  const confirmarMutation = useMutation({
    mutationFn: () => reservasApi.confirmar(id),
    onSuccess: () => {
      toast.success(t('alquileres.reservaDetalle.toast.confirmada'));
      setIsConfirmOpen(false);
      invalidate();
    },
    onError: (error: unknown) => handleApiError(error),
  });

  const cancelarMutation = useMutation({
    mutationFn: (motivoCancelacion: string) =>
      reservasApi.cancelar(id, { reservaId: id, motivoCancelacion }),
    onSuccess: () => {
      toast.success(t('alquileres.reservaDetalle.toast.cancelada'));
      setIsCancelOpen(false);
      invalidate();
    },
    onError: (error: unknown) => handleApiError(error),
  });

  const noShowMutation = useMutation({
    mutationFn: () => reservasApi.marcarNoShow(id, { reservaId: id }),
    onSuccess: () => {
      toast.success(t('alquileres.reservaDetalle.toast.noShow'));
      setIsNoShowOpen(false);
      invalidate();
    },
    onError: (error: unknown) => handleApiError(error),
  });

  const registrarPagoMutation = useMutation({
    mutationFn: (data: RegistrarPagoManualRequest) => pagosAlquilerApi.registrarManual(data),
    onSuccess: () => {
      toast.success(t('alquileres.reservaDetalle.toast.pagoRegistrado'));
      setIsPagoOpen(false);
      invalidate();
    },
    onError: (error: unknown) => handleApiError(error),
  });

  const generarContratoMutation = useMutation({
    mutationFn: () => contratosApi.generar({ reservaId: id }),
    onSuccess: () => {
      toast.success(t('alquileres.reservaDetalle.toast.contratoGenerado'));
      queryClient.invalidateQueries({ queryKey: [RESERVA_QUERY_KEY, id, 'contrato'] });
    },
    onError: (error: unknown) => handleApiError(error),
  });

  // ───── Descargar PDF ─────

  const handleDescargarPdf = useCallback(async (contratoId: string) => {
    try {
      const { url } = await contratosApi.getPdf(contratoId);
      window.open(url, '_blank');
    } catch (err: unknown) {
      handleApiError(err);
    }
  }, [handleApiError]);

  return {
    // Modales
    isConfirmOpen,
    setIsConfirmOpen,
    isNoShowOpen,
    setIsNoShowOpen,
    isCancelOpen,
    setIsCancelOpen,
    isCheckOutOpen,
    setIsCheckOutOpen,
    isCheckInOpen,
    setIsCheckInOpen,
    isPagoOpen,
    setIsPagoOpen,

    // Acciones
    confirmar: () => confirmarMutation.mutate(),
    cancelar: (motivo: string) => cancelarMutation.mutate(motivo),
    marcarNoShow: () => noShowMutation.mutate(),
    registrarPago: async (data: RegistrarPagoManualRequest) => { await registrarPagoMutation.mutateAsync(data); },
    generarContrato: () => generarContratoMutation.mutate(),
    descargarPdf: handleDescargarPdf,

    // Mutation states
    isConfirming: confirmarMutation.isPending,
    isCancelling: cancelarMutation.isPending,
    isMarkingNoShow: noShowMutation.isPending,
    isGenerandoContrato: generarContratoMutation.isPending,
  };
}
