/**
 * Sanitizador de payloads para remover campos server-managed
 * 
 * Campos que son server-managed y NO deben enviarse en requests:
 * - organizacionId (se obtiene del JWT token)
 * - fechaCreacion / fechaActualizacion (se asignan automáticamente)
 * - creadoPorUsuarioId / modificadoPorUsuarioId (se obtienen del JWT token)
 */

/**
 * Campos que son server-managed y NO deben enviarse en requests
 */
const SERVER_MANAGED_FIELDS = [
  'organizacionId',
  'fechaCreacion',
  'fechaActualizacion',
  'creadoPorUsuarioId',
  'modificadoPorUsuarioId',
] as const;

/**
 * Sanitiza payload removiendo campos server-managed.
 * Solo aplica a objetos JSON planos (no FormData, Blob, etc.)
 * 
 * @param payload - Objeto a sanitizar
 * @returns Payload sin campos server-managed
 */
export function sanitizePayload<T extends Record<string, unknown>>(payload: T): T {
  // No sanitizar si no es objeto plano
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  
  // No sanitizar FormData, Blob, File, etc.
  if (payload instanceof FormData || 
      payload instanceof Blob || 
      payload instanceof File ||
      Array.isArray(payload)) {
    return payload;
  }
  
  const sanitized = { ...payload };
  const removed: string[] = [];
  
  SERVER_MANAGED_FIELDS.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
      removed.push(field);
    }
  });
  
  // Log warning solo en desarrollo si se removieron campos
  if (removed.length > 0 && import.meta.env.DEV) {
    console.warn(
      '[PayloadSanitizer] Campos server-managed removidos del request:',
      removed.join(', '),
      '\nPayload original:',
      payload
    );
  }
  
  return sanitized;
}

