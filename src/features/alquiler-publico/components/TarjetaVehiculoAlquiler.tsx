import { memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Car, Calendar, MapPin, Users, DoorOpen, Cog } from 'lucide-react';
import { Card, CardContent, Button } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import { alquilerPublicoApi } from '@/services/endpoints/alquiler-publico.api';
import type { VehiculoDisponibleDto } from '../types/busqueda';
import { CATEGORIA_ICONS } from '../constants/categorias';

interface TarjetaVehiculoAlquilerProps {
  vehiculo: VehiculoDisponibleDto;
}

export const TarjetaVehiculoAlquiler = memo(function TarjetaVehiculoAlquiler({ vehiculo }: TarjetaVehiculoAlquilerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const handlePrefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['alquiler-publico-vehiculo', vehiculo.id],
      queryFn: () => alquilerPublicoApi.getVehiculo(vehiculo.id),
      staleTime: 10 * 60 * 1000,
    });
  }, [queryClient, vehiculo.id]);

  const Icon = CATEGORIA_ICONS[vehiculo.categoriaAlquiler] ?? Car;
  const categoriaNombre = t(`alquileres.flota.categorias.${vehiculo.categoriaAlquiler}`);
  const titulo = vehiculo.marca && vehiculo.modelo
    ? `${vehiculo.marca} ${vehiculo.modelo}`
    : vehiculo.patente;

  return (
    <Card padding="none" className="h-full flex flex-col overflow-hidden">
      {/* Parte superior — foto o ícono de categoría */}
      <div className="relative bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center py-8">
        {vehiculo.imagenPrincipalUrl ? (
          <img
            src={vehiculo.imagenPrincipalUrl}
            alt={titulo}
            className="w-full h-32 object-cover"
            loading="lazy"
          />
        ) : (
          <Icon className="w-16 h-16 text-primary/60" />
        )}
        {/* Badge categoría */}
        <span className="absolute top-3 right-3 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {categoriaNombre}
        </span>
      </div>

      {/* Contenido */}
      <CardContent className="flex-1 flex flex-col">
        {/* Título */}
        <h3 className="font-semibold text-text text-base mb-2">{titulo}</h3>

        {/* Specs row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mb-4">
          {vehiculo.anio && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {vehiculo.anio}
            </span>
          )}
          {vehiculo.transmision != null && (
            <span className="flex items-center gap-1">
              <Cog size={12} />
              {t(`alquileres.flota.transmision.${vehiculo.transmision}`)}
            </span>
          )}
          {vehiculo.cantidadPasajeros != null && (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {vehiculo.cantidadPasajeros}
            </span>
          )}
          {vehiculo.cantidadPuertas != null && (
            <span className="flex items-center gap-1">
              <DoorOpen size={12} />
              {vehiculo.cantidadPuertas}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {vehiculo.sucursalNombre}
          </span>
        </div>

        {/* Precios */}
        <div className="mt-auto space-y-1">
          <p className="text-sm text-text-muted">
            {formatCurrency(vehiculo.precioBaseDiario)}{t('alquilerPublico.resultados.precioDia')}
          </p>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(vehiculo.precioIndicativo)}
            <span className="text-xs font-normal text-text-muted ml-1">
              {t('alquilerPublico.resultados.precioTotal')}
            </span>
          </p>
        </div>

        {/* Botón seleccionar */}
        <Button
          variant="primary"
          size="sm"
          className="w-full mt-4"
          onClick={() => navigate(`/vehiculo/${vehiculo.id}?${searchParams.toString()}`)}
          onMouseEnter={handlePrefetch}
        >
          {t('alquilerPublico.resultados.seleccionar')}
        </Button>
      </CardContent>
    </Card>
  );
});
