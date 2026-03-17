import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { preferenciasNotificacionApi } from '../api/preferenciasNotificacion.api';
import { useToastStore } from '@/store/toast.store';
import { useErrorHandler } from '@/hooks';
import type {
  PreferenciasNotificacionDto,
  ActualizarPreferenciasRequest,
  CategoriaNotificacion,
} from '../types';

export function usePreferenciasNotificacion() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const toast = useToastStore();

  const [preferencias, setPreferencias] =
    useState<PreferenciasNotificacionDto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del flujo de verificacion
  const [telefonoPendiente, setTelefonoPendiente] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  const cargarPreferencias = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await preferenciasNotificacionApi.obtener();
      setPreferencias(data);
    } catch (err) {
      handleApiError(err);
      setError(t('preferenciasNotificacion.errorCargar'));
    } finally {
      setCargando(false);
    }
  }, [handleApiError, t]);

  useEffect(() => {
    void cargarPreferencias();
  }, [cargarPreferencias]);

  const actualizarPreferencias = async (data: ActualizarPreferenciasRequest) => {
    try {
      setGuardando(true);
      const updated = await preferenciasNotificacionApi.actualizar(data);
      setPreferencias(updated);
      toast.success(t('preferenciasNotificacion.guardadoExitoso'));
    } catch (err) {
      handleApiError(err);
    } finally {
      setGuardando(false);
    }
  };

  const enviarCodigoWhatsApp = async (telefono: string) => {
    try {
      setEnviandoCodigo(true);
      await preferenciasNotificacionApi.enviarCodigoWhatsApp({ telefono });
      setTelefonoPendiente(telefono);
      setCodigoEnviado(true);
      toast.success(t('preferenciasNotificacion.codigoEnviado'));
    } catch (err) {
      handleApiError(err);
    } finally {
      setEnviandoCodigo(false);
    }
  };

  const verificarTelefono = async (codigo: string) => {
    try {
      setVerificando(true);
      const updated = await preferenciasNotificacionApi.verificarTelefono({
        telefono: telefonoPendiente,
        codigo,
      });
      setPreferencias(updated);
      setCodigoEnviado(false);
      setTelefonoPendiente('');
      toast.success(t('preferenciasNotificacion.telefonoVerificado'));
    } catch (err) {
      handleApiError(err);
    } finally {
      setVerificando(false);
    }
  };

  const toggleWhatsApp = async (habilitado: boolean) => {
    if (!preferencias) return;
    await actualizarPreferencias({
      whatsAppHabilitado: habilitado,
      emailHabilitado: preferencias.emailHabilitado,
      categoriasWhatsApp: preferencias.categoriasWhatsApp,
    });
  };

  const toggleEmail = async (habilitado: boolean) => {
    if (!preferencias) return;
    await actualizarPreferencias({
      whatsAppHabilitado: preferencias.whatsAppHabilitado,
      emailHabilitado: habilitado,
      categoriasWhatsApp: preferencias.categoriasWhatsApp,
    });
  };

  const actualizarCategoriasWhatsApp = async (
    categorias: CategoriaNotificacion[] | null
  ) => {
    if (!preferencias) return;
    await actualizarPreferencias({
      whatsAppHabilitado: preferencias.whatsAppHabilitado,
      emailHabilitado: preferencias.emailHabilitado,
      categoriasWhatsApp: categorias,
    });
  };

  return {
    preferencias,
    cargando,
    guardando,
    enviandoCodigo,
    verificando,
    error,
    codigoEnviado,
    telefonoPendiente,
    enviarCodigoWhatsApp,
    verificarTelefono,
    toggleWhatsApp,
    toggleEmail,
    actualizarCategoriasWhatsApp,
    recargar: cargarPreferencias,
  };
}
