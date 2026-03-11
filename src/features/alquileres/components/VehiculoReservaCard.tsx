import { useTranslation } from 'react-i18next';
import { Car } from 'lucide-react';
import { Card, CardHeader, Badge } from '@/shared/ui';

interface VehiculoReservaCardProps {
  vehiculoDescripcion: string | null;
  categoriaAlquiler: number;
}

export function VehiculoReservaCard({ vehiculoDescripcion, categoriaAlquiler }: VehiculoReservaCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader title={t('alquileres.reservaDetalle.vehiculo.titulo')} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Car size={20} className="text-primary" />
        </div>
        <div>
          {vehiculoDescripcion ? (
            <p className="text-sm font-medium text-text">{vehiculoDescripcion}</p>
          ) : (
            <p className="text-sm text-text-muted italic">{t('alquileres.reservaDetalle.vehiculo.sinAsignar')}</p>
          )}
          <Badge variant="default">{t(`alquileres.flota.categorias.${categoriaAlquiler}`)}</Badge>
        </div>
      </div>
    </Card>
  );
}
