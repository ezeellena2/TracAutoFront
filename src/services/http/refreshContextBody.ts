import { useAuthStore } from '@/store';

/**
 * Cuerpo para POST /auth/refresh (web, cookie).
 * Debe ser estable en contexto **Personal** (B2C): si falta `contextoActivo.id` en el usuario
 * hidratado, se usa `personaId` del store para que el backend resuelva el snapshot.
 */
export function buildRefreshContextBody(): {
  tipoContextoActivo: string;
  contextoActivoId: string | null;
} {
  const { user, personaId, organizationId } = useAuthStore.getState();

  const tipo = user?.contextoActivo?.tipo;
  const ctxId = user?.contextoActivo?.id ?? null;

  const looksPersonal =
    tipo === 'Personal' ||
    (!organizationId && !!personaId) ||
    (!organizationId && tipo !== 'Organizacion');

  if (looksPersonal || (!tipo && !organizationId)) {
    return {
      tipoContextoActivo: 'Personal',
      contextoActivoId: ctxId ?? personaId ?? null,
    };
  }

  return {
    tipoContextoActivo: tipo ?? 'Organizacion',
    contextoActivoId: ctxId ?? organizationId ?? null,
  };
}
