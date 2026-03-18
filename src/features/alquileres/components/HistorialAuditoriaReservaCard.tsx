import { History, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, EstadoVacio, Spinner } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils/dateFormatter';
import { useLocalization } from '@/hooks/useLocalization';
import type { HistorialAuditoriaCambioDto, HistorialAuditoriaDto } from '../types/reserva';

interface HistorialAuditoriaReservaCardProps {
  entries: HistorialAuditoriaDto[];
  isLoading: boolean;
}

const TIPO_ENTIDAD_LABEL_KEY: Record<string, string> = {
  ReservaAlquiler: 'alquileres.reservaDetalle.auditoria.tipoEntidad.reservaAlquiler',
  ContratoAlquiler: 'alquileres.reservaDetalle.auditoria.tipoEntidad.contratoAlquiler',
  CheckOutAlquiler: 'alquileres.reservaDetalle.auditoria.tipoEntidad.checkOutAlquiler',
  CheckInAlquiler: 'alquileres.reservaDetalle.auditoria.tipoEntidad.checkInAlquiler',
  PagoAlquiler: 'alquileres.reservaDetalle.auditoria.tipoEntidad.pagoAlquiler',
};

const ACCION_LABEL_KEY: Record<string, string> = {
  'reserva-creada': 'alquileres.reservaDetalle.auditoria.acciones.reservaCreada',
  'reserva-confirmada': 'alquileres.reservaDetalle.auditoria.acciones.reservaConfirmada',
  'reserva-cancelada': 'alquileres.reservaDetalle.auditoria.acciones.reservaCancelada',
  'reserva-no-show': 'alquileres.reservaDetalle.auditoria.acciones.reservaNoShow',
  'pago-completado': 'alquileres.reservaDetalle.auditoria.acciones.pagoCompletado',
  'contrato-generado': 'alquileres.reservaDetalle.auditoria.acciones.contratoGenerado',
  'contrato-enviado-firma-digital': 'alquileres.reservaDetalle.auditoria.acciones.contratoEnviadoFirmaDigital',
  'contrato-firmado': 'alquileres.reservaDetalle.auditoria.acciones.contratoFirmado',
  'check-out-realizado': 'alquileres.reservaDetalle.auditoria.acciones.checkOutRealizado',
  'check-in-realizado': 'alquileres.reservaDetalle.auditoria.acciones.checkInRealizado',
};

const CHANGE_LABEL_KEY: Record<string, string> = {
  estado: 'alquileres.reservaDetalle.auditoria.cambios.estado',
  numeroReserva: 'alquileres.reservaDetalle.auditoria.cambios.numeroReserva',
  fechaHoraRecogida: 'alquileres.reservaDetalle.auditoria.cambios.fechaHoraRecogida',
  fechaHoraDevolucion: 'alquileres.reservaDetalle.auditoria.cambios.fechaHoraDevolucion',
  fechaHoraReal: 'alquileres.reservaDetalle.auditoria.cambios.fechaHoraReal',
  sucursalRecogida: 'alquileres.reservaDetalle.auditoria.cambios.sucursalRecogida',
  sucursalDevolucion: 'alquileres.reservaDetalle.auditoria.cambios.sucursalDevolucion',
  montoTotal: 'alquileres.reservaDetalle.auditoria.cambios.montoTotal',
  montoPago: 'alquileres.reservaDetalle.auditoria.cambios.montoPago',
  vehiculo: 'alquileres.reservaDetalle.auditoria.cambios.vehiculo',
  motivoCancelacion: 'alquileres.reservaDetalle.auditoria.cambios.motivoCancelacion',
  infoReembolso: 'alquileres.reservaDetalle.auditoria.cambios.infoReembolso',
  metodoPago: 'alquileres.reservaDetalle.auditoria.cambios.metodoPago',
  referenciaExterna: 'alquileres.reservaDetalle.auditoria.cambios.referenciaExterna',
  kilometrajeInicial: 'alquileres.reservaDetalle.auditoria.cambios.kilometrajeInicial',
  kilometrajeFinal: 'alquileres.reservaDetalle.auditoria.cambios.kilometrajeFinal',
  nivelCombustible: 'alquileres.reservaDetalle.auditoria.cambios.nivelCombustible',
  deltaKilometros: 'alquileres.reservaDetalle.auditoria.cambios.deltaKilometros',
  deltaCombustible: 'alquileres.reservaDetalle.auditoria.cambios.deltaCombustible',
  danosDetectados: 'alquileres.reservaDetalle.auditoria.cambios.danosDetectados',
  descripcionDanos: 'alquileres.reservaDetalle.auditoria.cambios.descripcionDanos',
  recargoCombustible: 'alquileres.reservaDetalle.auditoria.cambios.recargoCombustible',
  recargoKmExcedente: 'alquileres.reservaDetalle.auditoria.cambios.recargoKmExcedente',
  recargoTardanza: 'alquileres.reservaDetalle.auditoria.cambios.recargoTardanza',
  recargoDanos: 'alquileres.reservaDetalle.auditoria.cambios.recargoDanos',
  totalRecargosCheckIn: 'alquileres.reservaDetalle.auditoria.cambios.totalRecargosCheckIn',
  numeroContrato: 'alquileres.reservaDetalle.auditoria.cambios.numeroContrato',
  plantillaVersion: 'alquileres.reservaDetalle.auditoria.cambios.plantillaVersion',
  estadoFirmaDigital: 'alquileres.reservaDetalle.auditoria.cambios.estadoFirmaDigital',
  firmaCliente: 'alquileres.reservaDetalle.auditoria.cambios.firmaCliente',
  metodoFirma: 'alquileres.reservaDetalle.auditoria.cambios.metodoFirma',
  firmadoPorNombre: 'alquileres.reservaDetalle.auditoria.cambios.firmadoPorNombre',
};

const SOURCE_LABEL_KEY: Record<string, string> = {
  'evento-dominio': 'alquileres.reservaDetalle.auditoria.fuentes.eventoDominio',
  'auditoria-entidad': 'alquileres.reservaDetalle.auditoria.fuentes.auditoriaEntidad',
};

const VALUE_LABEL_KEY: Record<string, string> = {
  tentativa: 'alquileres.reservaDetalle.auditoria.valores.tentativa',
  confirmada: 'alquileres.reservaDetalle.auditoria.valores.confirmada',
  enCurso: 'alquileres.reservaDetalle.auditoria.valores.enCurso',
  completada: 'alquileres.reservaDetalle.auditoria.valores.completada',
  cancelada: 'alquileres.reservaDetalle.auditoria.valores.cancelada',
  noShow: 'alquileres.reservaDetalle.auditoria.valores.noShow',
  realizado: 'alquileres.reservaDetalle.auditoria.valores.realizado',
  conDanos: 'alquileres.reservaDetalle.auditoria.valores.conDanos',
  sinDanos: 'alquileres.reservaDetalle.auditoria.valores.sinDanos',
  firmado: 'alquileres.reservaDetalle.auditoria.valores.firmado',
  pendienteFirma: 'alquileres.reservaDetalle.auditoria.valores.pendienteFirma',
  enviado: 'alquileres.reservaDetalle.auditoria.valores.enviado',
  rechazado: 'alquileres.reservaDetalle.auditoria.valores.rechazado',
  expirado: 'alquileres.reservaDetalle.auditoria.valores.expirado',
  error: 'alquileres.reservaDetalle.auditoria.valores.error',
  tarjeta: 'alquileres.reservaDetalle.auditoria.valores.tarjeta',
  efectivo: 'alquileres.reservaDetalle.auditoria.valores.efectivo',
  transferencia: 'alquileres.reservaDetalle.auditoria.valores.transferencia',
  mercadoPago: 'alquileres.reservaDetalle.auditoria.valores.mercadoPago',
  digital: 'alquileres.reservaDetalle.auditoria.valores.digital',
  enPersona: 'alquileres.reservaDetalle.auditoria.valores.enPersona',
  true: 'common.si',
  false: 'common.no',
};

const DATE_CHANGE_KEYS = new Set(['fechaHoraRecogida', 'fechaHoraDevolucion', 'fechaHoraReal']);

function normalizarTipoEntidad(tipoEntidad: string): string {
  return tipoEntidad.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

function formatAuditValue(
  cambio: HistorialAuditoriaCambioDto,
  value: string | null,
  culture: string,
  timeZoneId: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!value) {
    return t('alquileres.reservaDetalle.auditoria.sinDato');
  }

  if (DATE_CHANGE_KEYS.has(cambio.clave)) {
    return formatDateTime(value, culture, timeZoneId);
  }

  const labelKey = VALUE_LABEL_KEY[value];
  return labelKey ? t(labelKey) : value;
}

function renderChangeValue(
  cambio: HistorialAuditoriaCambioDto,
  culture: string,
  timeZoneId: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const anterior = formatAuditValue(cambio, cambio.valorAnterior, culture, timeZoneId, t);
  const nuevo = formatAuditValue(cambio, cambio.valorNuevo, culture, timeZoneId, t);

  if (cambio.valorAnterior && cambio.valorNuevo) {
    return `${anterior} -> ${nuevo}`;
  }

  return cambio.valorNuevo ? nuevo : anterior;
}

export function HistorialAuditoriaReservaCard({
  entries,
  isLoading,
}: HistorialAuditoriaReservaCardProps) {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();

  return (
    <Card>
      <CardHeader
        title={t('alquileres.reservaDetalle.auditoria.titulo')}
        subtitle={t('alquileres.reservaDetalle.auditoria.subtitulo')}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : entries.length === 0 ? (
        <EstadoVacio
          titulo={t('alquileres.reservaDetalle.auditoria.sinEventos')}
          descripcion={t('alquileres.reservaDetalle.auditoria.sinEventosDescripcion')}
          icono={<History className="h-14 w-14" />}
        />
      ) : (
        <div className="space-y-4">
          {entries.map(entry => {
            const tipoKey = TIPO_ENTIDAD_LABEL_KEY[entry.tipoEntidad];
            const tipoLabel = tipoKey ? t(tipoKey) : normalizarTipoEntidad(entry.tipoEntidad);
            const accionLabel = ACCION_LABEL_KEY[entry.accion]
              ? t(ACCION_LABEL_KEY[entry.accion])
              : entry.accion;
            const actor = entry.actor ?? entry.modificadoPor ?? entry.creadoPor ?? t('alquileres.reservaDetalle.auditoria.usuarioSistema');
            const fuente = SOURCE_LABEL_KEY[entry.fuente]
              ? t(SOURCE_LABEL_KEY[entry.fuente])
              : entry.fuente;
            const estado = entry.estado
              ? (VALUE_LABEL_KEY[entry.estado] ? t(VALUE_LABEL_KEY[entry.estado]) : entry.estado)
              : null;

            return (
              <div
                key={entry.id || `${entry.entidadId}-${entry.accion}-${entry.fechaEvento}`}
                className="rounded-xl border border-border bg-surface-secondary/35 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-text">{accionLabel}</p>
                    <p className="text-xs text-text-muted">{tipoLabel}</p>
                    {estado ? (
                      <p className="text-xs text-text-muted">
                        {t('alquileres.reservaDetalle.auditoria.estado')}: {estado}
                      </p>
                    ) : null}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs text-text-muted">
                    <UserRound className="h-3.5 w-3.5" />
                    <span>{actor}</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-surface px-3 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      {t('alquileres.reservaDetalle.auditoria.evento')}
                    </p>
                    <p className="mt-1 text-sm text-text">
                      {formatDateTime(entry.fechaEvento ?? entry.fechaCreacion, culture, timeZoneId)}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {t('alquileres.reservaDetalle.auditoria.fuente')}: {fuente}
                    </p>
                  </div>

                  <div className="rounded-lg bg-surface px-3 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      {t('alquileres.reservaDetalle.auditoria.ultimaActualizacion')}
                    </p>
                    <p className="mt-1 text-sm text-text">
                      {formatDateTime(entry.fechaActualizacion, culture, timeZoneId)}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {t('alquileres.reservaDetalle.auditoria.actualizadoPor', {
                        usuario: entry.modificadoPor ?? actor,
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-surface px-3 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    {t('alquileres.reservaDetalle.auditoria.cambiosTitulo')}
                  </p>

                  {entry.cambios.length > 0 ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {entry.cambios.map(cambio => {
                        const label = CHANGE_LABEL_KEY[cambio.clave]
                          ? t(CHANGE_LABEL_KEY[cambio.clave])
                          : cambio.clave;

                        return (
                          <div key={`${entry.id}-${cambio.clave}`} className="rounded-lg border border-border/70 px-3 py-2">
                            <p className="text-xs font-medium text-text-muted">{label}</p>
                            <p className="mt-1 text-sm text-text">
                              {renderChangeValue(cambio, culture, timeZoneId, t)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-text-muted">
                      {t('alquileres.reservaDetalle.auditoria.sinCambiosSemanticos')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}