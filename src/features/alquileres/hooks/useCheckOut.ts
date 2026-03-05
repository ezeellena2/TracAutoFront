import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { reservasApi } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import { toast } from '@/store/toast.store';
import { TipoInspeccion, ESTADO_INSPECCION_LABELS } from '../types/reserva';
import type { EstadoInspeccionKey } from '../types/reserva';

const QUERY_KEY = 'reserva-detalle';

export function useCheckOut(reservaId: string, sucursalIdPorDefecto: string, onSuccess: () => void) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  // --- Estado del formulario ---

  const [kilometrajeInicial, setKilometrajeInicial] = useState('');
  const [nivelCombustible, setNivelCombustible] = useState(50);
  const [estadoExterior, setEstadoExterior] = useState('');
  const [estadoExteriorDetalle, setEstadoExteriorDetalle] = useState('');
  const [estadoInterior, setEstadoInterior] = useState('');
  const [estadoInteriorDetalle, setEstadoInteriorDetalle] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [sucursalId, setSucursalId] = useState(sucursalIdPorDefecto);
  const [fotos, setFotos] = useState<File[]>([]);
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Validación ---

  const isValid =
    kilometrajeInicial !== '' &&
    Number(kilometrajeInicial) >= 0 &&
    estadoExterior !== '' &&
    estadoInterior !== '' &&
    sucursalId !== '';

  // --- Componer estado como string (label fijo en español para consistencia en DB) ---

  const componerEstado = (opcion: string, detalle: string): string => {
    const base = ESTADO_INSPECCION_LABELS[opcion as EstadoInspeccionKey] ?? opcion;
    return detalle.trim() ? `${base} - ${detalle.trim()}` : base;
  };

  // --- Reset ---

  const resetForm = useCallback(() => {
    setKilometrajeInicial('');
    setNivelCombustible(50);
    setEstadoExterior('');
    setEstadoExteriorDetalle('');
    setEstadoInterior('');
    setEstadoInteriorDetalle('');
    setObservaciones('');
    setSucursalId(sucursalIdPorDefecto);
    setFotos([]);
    setApiError(null);
    setIsSubmitting(false);
  }, [sucursalIdPorDefecto]);

  // --- Submit ---

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      // 1. Realizar check-out
      await reservasApi.realizarCheckOut(reservaId, {
        reservaId,
        kilometrajeInicial: Number(kilometrajeInicial),
        nivelCombustible,
        estadoExterior: componerEstado(estadoExterior, estadoExteriorDetalle),
        estadoInterior: componerEstado(estadoInterior, estadoInteriorDetalle),
        observaciones: observaciones.trim() || undefined,
        sucursalId,
      });

      // 2. Subir fotos si hay
      if (fotos.length > 0) {
        try {
          const formData = new FormData();
          formData.append('tipoInspeccion', String(TipoInspeccion.CheckOut));
          fotos.forEach(foto => formData.append('fotos', foto));
          await reservasApi.subirFotos(reservaId, formData);
        } catch {
          toast.warning(t('alquileres.reservaDetalle.toast.fotosError'));
        }
      }

      // 3. Éxito
      toast.success(t('alquileres.reservaDetalle.toast.checkOutRealizado'));
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, reservaId] });
      queryClient.invalidateQueries({ queryKey: ['reservas'] });
      onSuccess();
    } catch (err: unknown) {
      const parsed = handleApiError(err, { showToast: false });
      setApiError(parsed);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isValid, reservaId, kilometrajeInicial, nivelCombustible,
    estadoExterior, estadoExteriorDetalle, estadoInterior, estadoInteriorDetalle,
    observaciones, sucursalId, fotos, queryClient, onSuccess, handleApiError, t,
  ]);

  return {
    // Campos
    kilometrajeInicial,
    setKilometrajeInicial,
    nivelCombustible,
    setNivelCombustible,
    estadoExterior,
    setEstadoExterior,
    estadoExteriorDetalle,
    setEstadoExteriorDetalle,
    estadoInterior,
    setEstadoInterior,
    estadoInteriorDetalle,
    setEstadoInteriorDetalle,
    observaciones,
    setObservaciones,
    sucursalId,
    setSucursalId,
    fotos,
    setFotos,

    // Estado
    isValid,
    isSubmitting,
    apiError,

    // Acciones
    handleSubmit,
    resetForm,
  };
}
