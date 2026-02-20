import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { solicitudesCambioApi } from '@/services/endpoints';
import type { SolicitudContext } from '@/store/modoSolicitud.store';
import type { SolicitudCambioDto } from '@/shared/types/api';

const QUERY_KEY = 'solicitud-cambio';

export interface UseSolicitudChatOptions {
  contexto: SolicitudContext | null;
  solicitudId?: string;
  onEnviadoAJira?: () => void;
}

export function useSolicitudChat({ contexto, solicitudId: initialId, onEnviadoAJira }: UseSolicitudChatOptions) {
  const queryClient = useQueryClient();
  const [solicitudId, setSolicitudId] = useState<string | undefined>(initialId);
  const idRef = useRef<string | undefined>(initialId);
  idRef.current = solicitudId ?? initialId;

  const { data: solicitud, isLoading } = useQuery({
    queryKey: [QUERY_KEY, solicitudId ?? initialId],
    queryFn: () => solicitudesCambioApi.obtener(solicitudId ?? initialId!),
    enabled: !!(solicitudId ?? initialId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { contenido: string; imagenBase64?: string }) => {
      if (!contexto) throw new Error('Context required to create');
      return solicitudesCambioApi.crear({
        route: contexto.route,
        crKey: contexto.selector,
        label: contexto.label,
        entityType: contexto.entityType ?? null,
        entityId: contexto.entityId ?? null,
        elementTag: contexto.elementTag ?? null,
        pageTitle: contexto.pageTitle ?? null,
        mensajeInicial: payload.contenido,
      });
    },
    onSuccess: (data) => {
      setSolicitudId(data.id);
      idRef.current = data.id;
      queryClient.setQueryData([QUERY_KEY, data.id], data);
    },
  });

  const addMessageMutation = useMutation({
    mutationFn: (payload: { contenido: string; imagenBase64?: string }) => {
      const id = idRef.current;
      if (!id) throw new Error('Solicitud id required');
      return solicitudesCambioApi.agregarMensaje(id, {
        contenido: payload.contenido,
        imagenBase64: payload.imagenBase64,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEY, data.id], data);
    },
  });

  const enviarMutation = useMutation({
    mutationFn: () => {
      const id = idRef.current;
      if (!id) throw new Error('Solicitud id required');
      return solicitudesCambioApi.enviar(id);
    },
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEY, data.id], data);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.id] });
      onEnviadoAJira?.();
    },
  });

  const enviarMensaje = useCallback(
    async (contenido: string, imagenBase64?: string): Promise<SolicitudCambioDto> => {
      const id = idRef.current ?? initialId;
      if (id) {
        return addMessageMutation.mutateAsync({ contenido, imagenBase64 });
      }
      return createMutation.mutateAsync({ contenido, imagenBase64 });
    },
    [initialId, createMutation, addMessageMutation]
  );

  const isSending = createMutation.isPending || addMessageMutation.isPending;

  const enviarAJira = useCallback(() => {
    enviarMutation.mutate();
  }, [enviarMutation]);

  const solicitudData = solicitud ?? (createMutation.data ?? addMessageMutation.data ?? enviarMutation.data) ?? null;
  const mensajesUsuario = solicitudData?.mensajes?.filter((m) => m.rol === 'user').length ?? 0;

  return {
    solicitud: solicitudData,
    isLoading,
    enviarMensaje,
    isSending,
    enviarAJira,
    isEnviando: enviarMutation.isPending,
    errorEnviar: enviarMutation.error,
    solicitudId: solicitudId ?? initialId,
    error: createMutation.error ?? addMessageMutation.error,
    mensajesUsuario,
  };
}
