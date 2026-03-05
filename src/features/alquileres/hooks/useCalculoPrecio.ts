import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cotizacionApi } from '@/services/endpoints/alquiler.api';
import type { ResultadoCotizacionDto } from '../types/cotizacion';

interface UseCalculoPrecioParams {
  vehiculoAlquilerId?: string;
  categoriaAlquiler?: number;
  sucursalRecogidaId: string;
  sucursalDevolucionId: string;
  fechaHoraRecogida: string;
  fechaHoraDevolucion: string;
  recargosSeleccionadosIds: string[];
  coberturasSeleccionadasIds: string[];
  codigoPromocion?: string;
}

interface UseCalculoPrecioReturn {
  cotizacion: ResultadoCotizacionDto | null;
  isCotizando: boolean;
  error: string | null;
}

function serializeParams(params: UseCalculoPrecioParams): string {
  return JSON.stringify({
    v: params.vehiculoAlquilerId,
    c: params.categoriaAlquiler,
    sr: params.sucursalRecogidaId,
    sd: params.sucursalDevolucionId,
    fr: params.fechaHoraRecogida,
    fd: params.fechaHoraDevolucion,
    r: [...params.recargosSeleccionadosIds].sort(),
    co: [...params.coberturasSeleccionadasIds].sort(),
    p: params.codigoPromocion,
  });
}

export function useCalculoPrecio(params: UseCalculoPrecioParams): UseCalculoPrecioReturn {
  const recargosKey = [...params.recargosSeleccionadosIds].sort().join(',');
  const coberturasKey = [...params.coberturasSeleccionadasIds].sort().join(',');

  const serialized = useMemo(() => serializeParams(params), [
    params.vehiculoAlquilerId,
    params.categoriaAlquiler,
    params.sucursalRecogidaId,
    params.sucursalDevolucionId,
    params.fechaHoraRecogida,
    params.fechaHoraDevolucion,
    recargosKey,
    coberturasKey,
    params.codigoPromocion,
  ]);

  const [debouncedSerialized, setDebouncedSerialized] = useState(serialized);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSerialized(serialized);
    }, 500);
    return () => clearTimeout(timeout);
  }, [serialized]);

  const debouncedParams = useMemo<UseCalculoPrecioParams>(() => {
    const parsed = JSON.parse(debouncedSerialized);
    return {
      vehiculoAlquilerId: parsed.v,
      categoriaAlquiler: parsed.c,
      sucursalRecogidaId: parsed.sr,
      sucursalDevolucionId: parsed.sd,
      fechaHoraRecogida: parsed.fr,
      fechaHoraDevolucion: parsed.fd,
      recargosSeleccionadosIds: parsed.r ?? [],
      coberturasSeleccionadasIds: parsed.co ?? [],
      codigoPromocion: parsed.p,
    };
  }, [debouncedSerialized]);

  const enabled =
    !!debouncedParams.sucursalRecogidaId &&
    !!debouncedParams.sucursalDevolucionId &&
    !!debouncedParams.fechaHoraRecogida &&
    !!debouncedParams.fechaHoraDevolucion &&
    !!(debouncedParams.vehiculoAlquilerId || debouncedParams.categoriaAlquiler);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['cotizacion', debouncedSerialized],
    queryFn: () => cotizacionApi.cotizar({
      vehiculoAlquilerId: debouncedParams.vehiculoAlquilerId || undefined,
      categoriaAlquiler: debouncedParams.categoriaAlquiler || undefined,
      sucursalRecogidaId: debouncedParams.sucursalRecogidaId,
      sucursalDevolucionId: debouncedParams.sucursalDevolucionId,
      fechaHoraRecogida: debouncedParams.fechaHoraRecogida,
      fechaHoraDevolucion: debouncedParams.fechaHoraDevolucion,
      recargosSeleccionadosIds: debouncedParams.recargosSeleccionadosIds.length > 0
        ? debouncedParams.recargosSeleccionadosIds : undefined,
      coberturasSeleccionadasIds: debouncedParams.coberturasSeleccionadasIds.length > 0
        ? debouncedParams.coberturasSeleccionadasIds : undefined,
      codigoPromocion: debouncedParams.codigoPromocion || undefined,
    }),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    cotizacion: data ?? null,
    isCotizando: enabled && isLoading,
    error: queryError ? (queryError as Error).message : null,
  };
}
