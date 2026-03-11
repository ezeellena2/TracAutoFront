import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, MapPin, Calendar, Car } from 'lucide-react';
import { Card, CardContent, Button } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import { formatDateTime } from '@/shared/utils/dateFormatter';
import { useLocalization } from '@/hooks/useLocalization';
import { CotizacionDesglose } from '../CotizacionDesglose';
import type { VehiculoAlquilerPublicoDto } from '../../types/detalle';
import type { ResultadoCotizacionDto } from '@/features/alquileres/types/cotizacion';
import type { ValidacionPromocionDto } from '@/features/alquileres/types/promocion';
import type { SucursalPublicaDto } from '../../types/busqueda';

interface PasoResumenReservaProps {
  vehiculo: VehiculoAlquilerPublicoDto | null;
  sucursales: SucursalPublicaDto[];
  sucursalRecogidaId: string;
  sucursalDevolucionId: string;
  fechaHoraRecogida: string;
  fechaHoraDevolucion: string;
  cotizacion: ResultadoCotizacionDto | null;
  cotizacionLoading: boolean;
  cotizacionError: string | null;
  codigoPromo: string;
  promoValidada: ValidacionPromocionDto | null;
  promoError: string | null;
  promoLoading: boolean;
  onCambiarPromo: (codigo: string) => void;
  onValidarPromo: () => void;
}

export function PasoResumenReserva({
  vehiculo,
  sucursales,
  sucursalRecogidaId,
  sucursalDevolucionId,
  fechaHoraRecogida,
  fechaHoraDevolucion,
  cotizacion,
  cotizacionLoading,
  cotizacionError,
  codigoPromo,
  promoValidada,
  promoError,
  promoLoading,
  onCambiarPromo,
  onValidarPromo,
}: PasoResumenReservaProps) {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();

  const sucursalRecogida = sucursales.find(s => s.id === sucursalRecogidaId);
  const sucursalDevolucion = sucursales.find(s => s.id === sucursalDevolucionId);

  const formatFechaHora = (iso: string) => {
    if (!iso) return '—';
    return formatDateTime(iso, culture, timeZoneId);
  };

  const titulo = vehiculo
    ? (vehiculo.marca && vehiculo.modelo
      ? `${vehiculo.marca} ${vehiculo.modelo}`
      : vehiculo.patente)
    : '—';

  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-text">
        {t('alquilerPublico.reserva.resumen.titulo')}
      </h3>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Vehiculo */}
        <Card padding="none">
          <CardContent>
            <div className="flex items-start gap-3">
              <Car size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  {t('alquilerPublico.reserva.resumen.vehiculo')}
                </p>
                <p className="text-sm font-medium text-text mt-1">{titulo}</p>
                {vehiculo?.anio && (
                  <p className="text-xs text-text-muted">{vehiculo.anio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fechas */}
        <Card padding="none">
          <CardContent>
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  {t('alquilerPublico.reserva.resumen.fechas')}
                </p>
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-text-muted">{t('alquilerPublico.reserva.resumen.recogida')}</p>
                  <p className="text-sm text-text">{formatFechaHora(fechaHoraRecogida)}</p>
                  <p className="text-xs text-text-muted mt-2">{t('alquilerPublico.reserva.resumen.devolucion')}</p>
                  <p className="text-sm text-text">{formatFechaHora(fechaHoraDevolucion)}</p>
                  {cotizacion && (
                    <p className="text-xs text-primary font-medium mt-1">
                      {t('alquilerPublico.reserva.resumen.duracion', { dias: cotizacion.duracionDias })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sucursal recogida */}
        <Card padding="none">
          <CardContent>
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  {t('alquilerPublico.reserva.resumen.recogida')}
                </p>
                <p className="text-sm font-medium text-text mt-1">
                  {sucursalRecogida?.nombre ?? '—'}
                </p>
                {sucursalRecogida && (
                  <p className="text-xs text-text-muted">
                    {sucursalRecogida.direccion}, {sucursalRecogida.ciudad}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sucursal devolucion */}
        <Card padding="none">
          <CardContent>
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  {t('alquilerPublico.reserva.resumen.devolucion')}
                </p>
                <p className="text-sm font-medium text-text mt-1">
                  {sucursalDevolucion?.nombre ?? '—'}
                </p>
                {sucursalDevolucion && (
                  <p className="text-xs text-text-muted">
                    {sucursalDevolucion.direccion}, {sucursalDevolucion.ciudad}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Codigo promo */}
      <Card padding="none">
        <CardContent>
          <h4 className="text-sm font-semibold text-text mb-3">
            {t('alquilerPublico.promocion.titulo')}
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={codigoPromo}
              onChange={(e) => onCambiarPromo(e.target.value)}
              placeholder={t('alquilerPublico.promocion.placeholder')}
              aria-label="Código de promoción"
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onValidarPromo}
              disabled={!codigoPromo.trim() || promoLoading}
            >
              {promoLoading ? t('common.loading') : t('alquilerPublico.promocion.aplicar')}
            </Button>
          </div>
          {promoValidada?.esValida && (
            <div className="mt-3 p-3 bg-success/10 text-success rounded-lg text-sm">
              <p className="font-medium">{t('alquilerPublico.promocion.valida')}</p>
              <p className="text-xs mt-0.5">
                {t('alquilerPublico.promocion.descuentoFijo', { monto: formatCurrency(promoValidada.descuentoCalculado) })}
              </p>
            </div>
          )}
          {promoError && (
            <p className="mt-2 text-sm text-error">{promoError}</p>
          )}
        </CardContent>
      </Card>

      {/* Desglose precio */}
      <Card padding="none">
        <CardContent>
          <h4 className="text-sm font-semibold text-text mb-3">
            {t('alquilerPublico.cotizacion.titulo')}
          </h4>

          {cotizacionLoading && (
            <div className="flex items-center gap-2 text-text-muted py-4 justify-center">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">{t('alquilerPublico.cotizacion.cargando')}</span>
            </div>
          )}

          {cotizacionError && !cotizacionLoading && (
            <div className="flex items-start gap-2 p-3 bg-error/10 text-error rounded-lg text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{cotizacionError}</span>
            </div>
          )}

          {cotizacion && !cotizacionLoading && (
            <CotizacionDesglose cotizacion={cotizacion} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
