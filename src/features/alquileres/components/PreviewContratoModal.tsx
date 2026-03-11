import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { X, FileText } from 'lucide-react';
import { Modal, Button, Spinner, ApiErrorBanner } from '@/shared/ui';
import { formatDate, formatDateTime } from '@/shared/utils/dateFormatter';
import { useLocalization } from '@/hooks/useLocalization';
import { contratosApi } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import { reemplazarPlaceholders } from '../utils/contrato-placeholders';
import { RESERVA_QUERY_KEY } from '../hooks/useReservaData';
import type { ReservaAlquilerDetalleDto } from '../types/reserva';

interface PreviewContratoModalProps {
  isOpen: boolean;
  reservaId: string;
  reserva: ReservaAlquilerDetalleDto;
  onClose: () => void;
}

export function PreviewContratoModal({ isOpen, reservaId, reserva, onClose }: PreviewContratoModalProps) {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  // I1 fix: Cargar lista reducida de plantillas activas para encontrar la default
  const {
    data: plantillasData,
    isLoading: isLoadingPlantilla,
    error: plantillaError,
  } = useQuery({
    queryKey: ['alquiler-plantillas', 'default-preview'],
    queryFn: () => contratosApi.getPlantillas({ soloActivas: true, tamanoPagina: 10 }),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const plantillaDefault = useMemo(() => {
    if (!plantillasData?.items) return null;
    return plantillasData.items.find(p => p.esDefault) ?? plantillasData.items[0] ?? null;
  }, [plantillasData]);

  // Cargar detalle de la plantilla (para obtener el HTML)
  const {
    data: plantillaDetalle,
    isLoading: isLoadingDetalle,
  } = useQuery({
    queryKey: ['alquiler-plantillas', plantillaDefault?.id, 'detalle'],
    queryFn: () => contratosApi.getPlantillaById(plantillaDefault!.id),
    enabled: isOpen && !!plantillaDefault,
    staleTime: 5 * 60 * 1000,
  });

  // I2 fix: Mapear TODOS los placeholders — datos reales + texto descriptivo para los no disponibles
  const datosReserva = useMemo((): Record<string, string> => {
    const vehiculoDesc = reserva.vehiculoDescripcion ?? '';

    return {
      // Cliente — solo nombreCompleto disponible en ReservaAlquilerDetalleDto
      '{{cliente.nombreCompleto}}': reserva.clienteNombreCompleto,
      '{{cliente.email}}': t('alquileres.contratos.preview.datoServidor'),
      '{{cliente.telefono}}': t('alquileres.contratos.preview.datoServidor'),
      '{{cliente.documento}}': t('alquileres.contratos.preview.datoServidor'),
      '{{cliente.direccion}}': t('alquileres.contratos.preview.datoServidor'),

      // Vehiculo — solo vehiculoDescripcion como texto combinado
      '{{vehiculo.marca}}': vehiculoDesc || t('alquileres.contratos.preview.datoServidor'),
      '{{vehiculo.modelo}}': vehiculoDesc ? '' : t('alquileres.contratos.preview.datoServidor'),
      '{{vehiculo.patente}}': t('alquileres.contratos.preview.datoServidor'),
      '{{vehiculo.anio}}': t('alquileres.contratos.preview.datoServidor'),
      '{{vehiculo.categoria}}': t(`alquileres.flota.categorias.${reserva.categoriaAlquiler}`),

      // Reserva — todos disponibles
      '{{reserva.numero}}': reserva.numeroReserva,
      '{{reserva.fechaRecogida}}': formatDateTime(reserva.fechaHoraRecogida, culture, timeZoneId),
      '{{reserva.fechaDevolucion}}': formatDateTime(reserva.fechaHoraDevolucion, culture, timeZoneId),
      '{{reserva.precioTotal}}': reserva.precioTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 }),
      '{{reserva.deposito}}': reserva.montoDeposito.toLocaleString('es-AR', { minimumFractionDigits: 2 }),
      '{{reserva.moneda}}': reserva.moneda,

      // Organizacion — no disponible en DTO de reserva
      '{{organizacion.nombre}}': t('alquileres.contratos.preview.datoServidor'),
      '{{organizacion.cuit}}': t('alquileres.contratos.preview.datoServidor'),

      // Sucursal — nombres disponibles, direcciones no
      '{{sucursal.recogida.nombre}}': reserva.sucursalRecogida,
      '{{sucursal.recogida.direccion}}': t('alquileres.contratos.preview.datoServidor'),
      '{{sucursal.devolucion.nombre}}': reserva.sucursalDevolucion,
      '{{sucursal.devolucion.direccion}}': t('alquileres.contratos.preview.datoServidor'),

      // Otros
      '{{fecha.actual}}': formatDate(new Date(), culture, timeZoneId),
      '{{contrato.numero}}': t('alquileres.contratos.preview.datoServidor'),
    };
  }, [reserva, t]);

  // Preview HTML
  const previewHtml = useMemo(() => {
    if (!plantillaDetalle?.contenidoHtml) return '';
    return reemplazarPlaceholders(plantillaDetalle.contenidoHtml, datosReserva);
  }, [plantillaDetalle, datosReserva]);

  // Mutation: generar contrato
  const generarMutation = useMutation({
    mutationFn: () => contratosApi.generar({ reservaId }),
    onSuccess: () => {
      toast.success(t('alquileres.reservaDetalle.toast.contratoGenerado'));
      queryClient.invalidateQueries({ queryKey: [RESERVA_QUERY_KEY, reservaId, 'contrato'] });
      onClose();
    },
    onError: (error: unknown) => handleApiError(error),
  });

  // M1 fix: wrap handleApiError en useMemo para evitar side effects en render
  const apiError = useMemo(
    () => plantillaError ? handleApiError(plantillaError, { showToast: false }) : null,
    [plantillaError, handleApiError],
  );

  const isLoading = isLoadingPlantilla || isLoadingDetalle;
  const noPlantilla = !isLoading && !plantillaDefault;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <div className="p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-primary" />
            <h2 className="text-xl font-semibold text-text">{t('alquileres.contratos.preview.titulo')}</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {apiError && (
          <ApiErrorBanner error={apiError} jiraLabel="Error preview contrato" onReportClick={onClose} />
        )}

        {noPlantilla && (
          <p className="text-sm text-text-muted text-center py-8">
            {t('alquileres.contratos.preview.sinPlantillaDefault')}
          </p>
        )}

        {!isLoading && plantillaDetalle && (
          <>
            <p className="text-xs text-text-muted mb-3 italic">
              {t('alquileres.contratos.preview.datosReserva')}
            </p>

            {/* Preview renderizado */}
            <div
              className="border border-border rounded-lg p-6 bg-white min-h-[300px] mb-6 prose prose-sm max-w-none [&_p]:text-sm [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_table]:border-collapse [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-gray-300 [&_th]:px-2 [&_th]:py-1"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }}
            />

            {/* Confirmación */}
            <div className="bg-surface-alt rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-text">
                {t('alquileres.contratos.preview.confirmarGenerar')}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {t('alquileres.contratos.preview.confirmarGenerarMsg', { numero: reserva.numeroReserva })}
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={generarMutation.isPending}
                className="flex-1"
              >
                {t('alquileres.contratos.preview.cancelar')}
              </Button>
              <Button
                type="button"
                onClick={() => generarMutation.mutate()}
                disabled={generarMutation.isPending}
                className="flex-1"
              >
                {generarMutation.isPending
                  ? t('alquileres.contratos.preview.generando')
                  : t('alquileres.contratos.preview.generar')
                }
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
