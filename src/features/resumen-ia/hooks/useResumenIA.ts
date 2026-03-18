import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { resumenIAApi } from '../api/resumenIA.api';
import { useToastStore } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type {
  ConfiguracionResumenIADto,
  ResumenIADto,
  ResumenIAListDto,
  ActualizarConfiguracionRequest,
} from '../types';

export function useResumenIA() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const toast = useToastStore();

  const [configuracion, setConfiguracion] = useState<ConfiguracionResumenIADto | null>(null);
  const [historial, setHistorial] = useState<ResumenIAListDto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  const cargarConfiguracion = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await resumenIAApi.obtenerConfiguracion();
      setConfiguracion(data);
    } catch (err) {
      handleApiError(err);
      setError(t('resumenIA.errorCargar'));
    } finally {
      setCargando(false);
    }
  }, [handleApiError, t]);

  const cargarHistorial = useCallback(async (pag = 1) => {
    try {
      const data = await resumenIAApi.obtenerHistorial(pag);
      setHistorial(data);
      setPagina(pag);
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  useEffect(() => {
    void cargarConfiguracion();
    void cargarHistorial();
  }, [cargarConfiguracion, cargarHistorial]);

  const actualizarConfiguracion = async (data: ActualizarConfiguracionRequest) => {
    try {
      setGuardando(true);
      const updated = await resumenIAApi.actualizarConfiguracion(data);
      setConfiguracion(updated);
      toast.success(t('resumenIA.configuracionGuardada'));
    } catch (err) {
      handleApiError(err);
    } finally {
      setGuardando(false);
    }
  };

  const generarManual = async (): Promise<ResumenIADto | null> => {
    try {
      setGenerando(true);
      const resumen = await resumenIAApi.generarManual();
      toast.success(t('resumenIA.resumenGenerado'));
      await cargarHistorial(1);
      return resumen;
    } catch (err) {
      handleApiError(err);
      return null;
    } finally {
      setGenerando(false);
    }
  };

  return {
    configuracion,
    historial,
    cargando,
    guardando,
    generando,
    error,
    pagina,
    actualizarConfiguracion,
    generarManual,
    cargarHistorial,
    recargar: cargarConfiguracion,
  };
}
