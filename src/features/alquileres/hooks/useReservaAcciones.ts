import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reservasApi, contratosApi, pagosAlquilerApi, getChecklistInspeccionPdf } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { RegistrarPagoManualRequest } from '../types/reserva';
import { RESERVA_QUERY_KEY } from './useReservaData';

export function useReservaAcciones(id: string) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isNoShowOpen, setIsNoShowOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isPagoOpen, setIsPagoOpen] = useState(false);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [RESERVA_QUERY_KEY, id] });
    queryClient.invalidateQueries({ queryKey: [RESERVA_QUERY_KEY, id, 'contrato'] });
    queryClient.invalidateQueries({ queryKey: ['reservas'] });
  }, [queryClient, id]);

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
    mutationFn: (motivoCancelacion: string) => reservasApi.cancelar(id, { reservaId: id, motivoCancelacion }),
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

  const enviarFirmaDigitalMutation = useMutation({
    mutationFn: (contratoId: string) => contratosApi.enviarFirmaDigital(contratoId),
    onSuccess: (result) => {
      toast.success(
        result.idempotente
          ? t('alquileres.reservaDetalle.contrato.firmaDigitalYaEnviada')
          : t('alquileres.reservaDetalle.contrato.firmaDigitalEnviada')
      );

      if (!result.idempotente && result.urlAccion) {
        window.open(result.urlAccion, '_blank', 'noopener,noreferrer');
      }

      invalidate();
    },
    onError: (error: unknown) => handleApiError(error),
  });

  const handleDescargarPdf = useCallback(async (contratoId: string) => {
    try {
      const url = await contratosApi.getPdf(contratoId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: unknown) {
      handleApiError(err);
    }
  }, [handleApiError]);

  const descargarChecklist = useCallback(async (tipo: 'checkout' | 'checkin') => {
    try {
      const blob = await getChecklistInspeccionPdf(id, tipo);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `checklist-${tipo}-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      handleApiError(err);
    }
  }, [handleApiError, id]);

  return {
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

    confirmar: () => confirmarMutation.mutate(),
    cancelar: (motivo: string) => cancelarMutation.mutate(motivo),
    marcarNoShow: () => noShowMutation.mutate(),
    registrarPago: async (data: RegistrarPagoManualRequest) => { await registrarPagoMutation.mutateAsync(data); },
    generarContrato: () => generarContratoMutation.mutate(),
    enviarFirmaDigital: async (contratoId: string) => { await enviarFirmaDigitalMutation.mutateAsync(contratoId); },
    descargarPdf: handleDescargarPdf,
    descargarChecklistCheckOut: () => descargarChecklist('checkout'),
    descargarChecklistCheckIn: () => descargarChecklist('checkin'),

    isConfirming: confirmarMutation.isPending,
    isCancelling: cancelarMutation.isPending,
    isMarkingNoShow: noShowMutation.isPending,
    isGenerandoContrato: generarContratoMutation.isPending,
    isEnviandoFirmaDigital: enviarFirmaDigitalMutation.isPending,
  };
}
