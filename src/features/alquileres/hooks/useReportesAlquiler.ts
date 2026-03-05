import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { reportesAlquilerApi, sucursalesApi } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import { downloadBlob } from '@/shared/utils/fileUtils';
import { primerDiaMesISO, hoyISO } from '@/shared/utils/dateFormatter';
import {
  AgrupacionPeriodo,
  TipoReporte,
  FormatoExportacion,
  OrdenTopVehiculos,
} from '../types/reportes';

export function useReportesAlquiler() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();

  // Filtros
  const [fechaInicio, setFechaInicio] = useState(primerDiaMesISO);
  const [fechaFin, setFechaFin] = useState(hoyISO);
  const [sucursalId, setSucursalId] = useState('');
  const [categoria, setCategoria] = useState('');
  const [agrupacion, setAgrupacion] = useState<AgrupacionPeriodo>(AgrupacionPeriodo.Mes);

  const fechasValidas = !!fechaInicio && !!fechaFin;

  // Sucursales para filtro select
  const { data: sucursalesData } = useQuery({
    queryKey: ['alquiler-sucursales', 'filter-list'],
    queryFn: () => sucursalesApi.list({ soloActivas: true, tamanoPagina: 100 }),
  });
  const sucursalesFiltro = sucursalesData?.items ?? [];

  // Estadísticas
  const {
    data: estadisticas,
    isLoading: isLoadingEstadisticas,
  } = useQuery({
    queryKey: ['alquiler-reportes', 'estadisticas', fechaInicio, fechaFin],
    queryFn: () => reportesAlquilerApi.getEstadisticasReservas({ fechaInicio, fechaFin }),
    enabled: fechasValidas,
    staleTime: 5 * 60 * 1000,
  });

  // Ingresos
  const {
    data: ingresos,
    isLoading: isLoadingIngresos,
  } = useQuery({
    queryKey: ['alquiler-reportes', 'ingresos', fechaInicio, fechaFin, agrupacion, sucursalId, categoria],
    queryFn: () =>
      reportesAlquilerApi.getIngresos({
        fechaInicio,
        fechaFin,
        agrupacion,
        ...(sucursalId ? { sucursalId } : {}),
        ...(categoria ? { categoria: Number(categoria) } : {}),
      }),
    enabled: fechasValidas,
    staleTime: 5 * 60 * 1000,
  });

  // Utilización
  const {
    data: utilizacion,
    isLoading: isLoadingUtilizacion,
  } = useQuery({
    queryKey: ['alquiler-reportes', 'utilizacion', fechaInicio, fechaFin, sucursalId, categoria],
    queryFn: () =>
      reportesAlquilerApi.getUtilizacionFlota({
        fechaInicio,
        fechaFin,
        ...(sucursalId ? { sucursalId } : {}),
        ...(categoria ? { categoria: Number(categoria) } : {}),
      }),
    enabled: fechasValidas,
    staleTime: 5 * 60 * 1000,
  });

  // Top vehículos
  const {
    data: topVehiculos,
    isLoading: isLoadingTop,
  } = useQuery({
    queryKey: ['alquiler-reportes', 'top-vehiculos', fechaInicio, fechaFin],
    queryFn: () =>
      reportesAlquilerApi.getTopVehiculos({
        fechaInicio,
        fechaFin,
        top: 10,
        ordenarPor: OrdenTopVehiculos.MasAlquilados,
      }),
    enabled: fechasValidas,
    staleTime: 5 * 60 * 1000,
  });

  // Exportar
  const exportarMutation = useMutation({
    mutationFn: (tipoReporte: TipoReporte) =>
      reportesAlquilerApi.exportar({
        tipoReporte,
        formato: FormatoExportacion.Excel,
        fechaInicio,
        fechaFin,
        ...(sucursalId ? { sucursalId } : {}),
        ...(categoria ? { categoria: Number(categoria) } : {}),
        agrupacion,
      }),
    onSuccess: (blob, tipoReporte) => {
      const nombres: Record<TipoReporte, string> = {
        [TipoReporte.UtilizacionFlota]: 'utilizacion-flota',
        [TipoReporte.Ingresos]: 'ingresos',
        [TipoReporte.EstadisticasReservas]: 'estadisticas-reservas',
        [TipoReporte.TopVehiculos]: 'top-vehiculos',
      };
      downloadBlob(blob, `reporte-${nombres[tipoReporte]}-${fechaInicio}-${fechaFin}.xlsx`);
      toast.success(t('alquileres.reportes.exportar.exito'));
    },
    onError: (error: unknown) => handleApiError(error),
  });

  const exportar = useCallback(
    (tipoReporte: TipoReporte) => exportarMutation.mutate(tipoReporte),
    [exportarMutation],
  );

  const isLoading = isLoadingEstadisticas || isLoadingIngresos || isLoadingUtilizacion || isLoadingTop;

  // Opciones de agrupación para el select
  const agrupacionOptions = useMemo(
    () => [
      { value: AgrupacionPeriodo.Dia, label: t('alquileres.reportes.agrupacion.dia') },
      { value: AgrupacionPeriodo.Semana, label: t('alquileres.reportes.agrupacion.semana') },
      { value: AgrupacionPeriodo.Mes, label: t('alquileres.reportes.agrupacion.mes') },
    ],
    [t],
  );

  return {
    // Datos
    estadisticas,
    ingresos,
    utilizacion,
    topVehiculos,
    isLoading,
    // Filtros
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    sucursalId,
    setSucursalId,
    categoria,
    setCategoria,
    agrupacion,
    setAgrupacion,
    agrupacionOptions,
    sucursalesFiltro,
    // Exportar
    exportar,
    isExportando: exportarMutation.isPending,
  };
}
