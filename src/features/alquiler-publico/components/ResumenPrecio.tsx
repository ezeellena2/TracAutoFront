import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, Button } from '@/shared/ui';
import { CotizacionDesglose } from './CotizacionDesglose';
import type { ResultadoCotizacionDto } from '@/features/alquileres/types/cotizacion';

interface ResumenPrecioProps {
  cotizacion: ResultadoCotizacionDto | null;
  isLoading: boolean;
  error: string | null;
  onReservar: () => void;
}

export function ResumenPrecio({ cotizacion, isLoading, error, onReservar }: ResumenPrecioProps) {
  const { t } = useTranslation();

  return (
    <Card padding="none">
      <CardContent>
        <h2 className="font-semibold text-lg text-text mb-4">
          {t('alquilerPublico.cotizacion.titulo')}
        </h2>

        {/* Cargando */}
        {isLoading && (
          <div className="flex items-center gap-2 text-text-muted py-8 justify-center">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">{t('alquilerPublico.cotizacion.cargando')}</span>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex items-start gap-2 p-3 bg-error/10 text-error rounded-lg text-sm mb-4">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Sin cotizacion y sin error/loading — faltan fechas */}
        {!cotizacion && !isLoading && !error && (
          <p className="text-sm text-text-muted text-center py-8">
            {t('alquilerPublico.cotizacion.sinFechas')}
          </p>
        )}

        {/* Desglose + Boton Reservar */}
        {cotizacion && !isLoading && (
          <>
            <CotizacionDesglose cotizacion={cotizacion} />

            <Button
              variant="primary"
              className="w-full mt-5"
              onClick={onReservar}
              disabled={!!error}
            >
              {t('alquilerPublico.cotizacion.reservar')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
