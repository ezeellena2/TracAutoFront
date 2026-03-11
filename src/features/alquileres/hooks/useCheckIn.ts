import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { reservasApi } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import type { ParsedError } from '@/hooks';
import { toast } from '@/store/toast.store';
import { TipoInspeccion, ESTADO_INSPECCION_LABELS } from '../types/reserva';
import type { CheckOutAlquilerDto, EstadoInspeccionKey } from '../types/reserva';

const QUERY_KEY = 'reserva-detalle';

export function useCheckIn(
  reservaId: string,
  checkOutData: CheckOutAlquilerDto | null,
  sucursalIdPorDefecto: string,
  onSuccess: () => void,
) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  // --- Estado del formulario ---

  const [kilometrajeFinal, setKilometrajeFinal] = useState('');
  const [nivelCombustible, setNivelCombustible] = useState(50);
  const [estadoExterior, setEstadoExterior] = useState('');
  const [estadoExteriorDetalle, setEstadoExteriorDetalle] = useState('');
  const [estadoInterior, setEstadoInterior] = useState('');
  const [estadoInteriorDetalle, setEstadoInteriorDetalle] = useState('');
  const [danosDetectados, setDanosDetectados] = useState(false);
  const [descripcionDanos, setDescripcionDanos] = useState('');
  const [recargoDanos, setRecargoDanos] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [sucursalId, setSucursalId] = useState(sucursalIdPorDefecto);
  const [fotos, setFotos] = useState<File[]>([]);
  const [apiError, setApiError] = useState<ParsedError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Validación ---

  const kmMin = checkOutData?.kilometrajeInicial ?? 0;

  const isValid =
    kilometrajeFinal !== '' &&
    Number(kilometrajeFinal) >= kmMin &&
    estadoExterior !== '' &&
    estadoInterior !== '' &&
    sucursalId !== '' &&
    (!danosDetectados || descripcionDanos.trim() !== '');

  // --- Componer estado como string (label fijo en español para consistencia en DB) ---

  const componerEstado = (opcion: string, detalle: string): string => {
    const base = ESTADO_INSPECCION_LABELS[opcion as EstadoInspeccionKey] ?? opcion;
    return detalle.trim() ? `${base} - ${detalle.trim()}` : base;
  };

  // --- Reset ---

  const resetForm = useCallback(() => {
    setKilometrajeFinal('');
    setNivelCombustible(50);
    setEstadoExterior('');
    setEstadoExteriorDetalle('');
    setEstadoInterior('');
    setEstadoInteriorDetalle('');
    setDanosDetectados(false);
    setDescripcionDanos('');
    setRecargoDanos('');
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
      // 1. Realizar check-in
      await reservasApi.realizarCheckIn(reservaId, {
        reservaId,
        kilometrajeFinal: Number(kilometrajeFinal),
        nivelCombustible,
        estadoExterior: componerEstado(estadoExterior, estadoExteriorDetalle),
        estadoInterior: componerEstado(estadoInterior, estadoInteriorDetalle),
        danosDetectados,
        descripcionDanos: danosDetectados ? descripcionDanos.trim() : undefined,
        recargoDanos: danosDetectados && recargoDanos !== '' ? Number(recargoDanos) : undefined,
        observaciones: observaciones.trim() || undefined,
        sucursalId,
      });

      // 2. Subir fotos si hay
      if (fotos.length > 0) {
        try {
          const formData = new FormData();
          formData.append('tipoInspeccion', String(TipoInspeccion.CheckIn));
          fotos.forEach(foto => formData.append('fotos', foto));
          await reservasApi.subirFotos(reservaId, formData);
        } catch {
          toast.warning(t('alquileres.reservaDetalle.toast.fotosErrorCheckIn'));
        }
      }

      // 3. Éxito
      toast.success(t('alquileres.reservaDetalle.toast.checkInRealizado'));
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
    isValid, reservaId, kilometrajeFinal, nivelCombustible,
    estadoExterior, estadoExteriorDetalle, estadoInterior, estadoInteriorDetalle,
    danosDetectados, descripcionDanos, recargoDanos,
    observaciones, sucursalId, fotos, queryClient, onSuccess, handleApiError, t,
  ]);

  return {
    // Campos
    kilometrajeFinal,
    setKilometrajeFinal,
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
    danosDetectados,
    setDanosDetectados,
    descripcionDanos,
    setDescripcionDanos,
    recargoDanos,
    setRecargoDanos,
    observaciones,
    setObservaciones,
    sucursalId,
    setSucursalId,
    fotos,
    setFotos,

    // Validación
    isValid,
    kmMin,

    // Estado
    isSubmitting,
    apiError,

    // Acciones
    handleSubmit,
    resetForm,
  };
}
