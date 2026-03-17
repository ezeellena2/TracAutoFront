import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorHandler } from '@/hooks';
import { useToastStore } from '@/store';
import { copilotoApi } from '../api';
import { RolMensajeCopiloto } from '../types';
import type {
  MensajeCopilotoDto,
  ConversacionCopilotoDto,
  UsoDiarioCopilotoDto,
} from '../types';

export function useCopiloto() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const toast = useToastStore();

  const [conversacionActual, setConversacionActual] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<MensajeCopilotoDto[]>([]);
  const [conversaciones, setConversaciones] = useState<ConversacionCopilotoDto[]>([]);
  const [usoDiario, setUsoDiario] = useState<UsoDiarioCopilotoDto | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cargarConversaciones = useCallback(async () => {
    try {
      const result = await copilotoApi.obtenerConversaciones();
      setConversaciones(result);
    } catch {
      // Silently fail - not critical
    }
  }, []);

  const cargarUsoDiario = useCallback(async () => {
    try {
      const result = await copilotoApi.obtenerUsoDiario();
      setUsoDiario(result);
    } catch {
      // Silently fail
    }
  }, []);

  const cargarConversacion = useCallback(async (id: string) => {
    try {
      const result = await copilotoApi.obtenerMensajes(id);
      setMensajes(result);
      setConversacionActual(id);
      setError(null);
    } catch (e) {
      const parsed = handleApiError(e, { showToast: false });
      setError(parsed.message);
    }
  }, [handleApiError]);

  const enviarMensaje = useCallback(async (texto: string) => {
    if (!texto.trim() || enviando) return;

    // Optimistic: mostrar mensaje del usuario inmediatamente
    const mensajeOptimista: MensajeCopilotoDto = {
      id: `temp-${Date.now()}`,
      rol: RolMensajeCopiloto.Usuario,
      contenido: texto,
      metadata: null,
      fechaCreacion: new Date().toISOString(),
    };
    setMensajes((prev) => [...prev, mensajeOptimista]);
    setEnviando(true);
    setError(null);

    try {
      const respuesta = await copilotoApi.enviarMensaje({
        conversacionId: conversacionActual ?? undefined,
        mensaje: texto,
      });

      // Actualizar conversación actual
      if (!conversacionActual) {
        setConversacionActual(respuesta.conversacionId);
      }

      // Agregar respuesta del asistente con tipo y datos estructurados en metadata
      const metadataObj = {
        tipo: respuesta.tipo,
        datosEstructurados: respuesta.datosEstructurados ?? null,
        accionSugerida: respuesta.accionSugerida ?? null,
      };
      const mensajeAsistente: MensajeCopilotoDto = {
        id: `resp-${Date.now()}`,
        rol: RolMensajeCopiloto.Asistente,
        contenido: respuesta.contenido,
        metadata: JSON.stringify(metadataObj),
        fechaCreacion: new Date().toISOString(),
      };
      setMensajes((prev) => [...prev, mensajeAsistente]);

      // Refrescar conversaciones y uso
      void cargarConversaciones();
      void cargarUsoDiario();
    } catch (e) {
      const parsed = handleApiError(e, { showToast: false });
      setError(parsed.message);
      // Remover mensaje optimista si falló
      setMensajes((prev) => prev.filter((m) => m.id !== mensajeOptimista.id));
    } finally {
      setEnviando(false);
    }
  }, [conversacionActual, enviando, handleApiError, cargarConversaciones, cargarUsoDiario]);

  const nuevaConversacion = useCallback(() => {
    setConversacionActual(null);
    setMensajes([]);
    setError(null);
  }, []);

  const eliminarConversacion = useCallback(async (id: string) => {
    try {
      await copilotoApi.eliminarConversacion(id);
      toast.success(t('copiloto.eliminarConversacion'));
      if (conversacionActual === id) {
        nuevaConversacion();
      }
      void cargarConversaciones();
    } catch (e) {
      handleApiError(e);
    }
  }, [conversacionActual, nuevaConversacion, cargarConversaciones, handleApiError, t, toast]);

  const copiarRespuesta = useCallback(async (contenido: string) => {
    try {
      await navigator.clipboard.writeText(contenido);
      toast.success(t('copiloto.respuestaCopiada'));
    } catch {
      // Fallback
    }
  }, [t, toast]);

  // Cargar datos iniciales
  useEffect(() => {
    void cargarConversaciones();
    void cargarUsoDiario();
    return () => {
      abortRef.current?.abort();
    };
  }, [cargarConversaciones, cargarUsoDiario]);

  return {
    conversacionActual,
    mensajes,
    conversaciones,
    usoDiario,
    enviando,
    error,
    enviarMensaje,
    nuevaConversacion,
    cargarConversacion,
    eliminarConversacion,
    copiarRespuesta,
  };
}
