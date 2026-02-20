/**
 * Sanitizador de payloads para remover campos server-managed
 *
 * Campos que son server-managed y NO deben enviarse en requests:
 * - organizacionId (se obtiene del JWT token)
 * - fechaCreacion / fechaActualizacion (se asignan automáticamente)
 * - creadoPorUsuarioId / modificadoPorUsuarioId (se obtienen del JWT token)
 */

const SERVER_MANAGED_FIELDS = [
  'organizacionId',
  'fechaCreacion',
  'fechaActualizacion',
  'creadoPorUsuarioId',
  'modificadoPorUsuarioId',
] as const;

const MAX_DEPTH = 10;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    !(value instanceof Date) && !(value instanceof RegExp) &&
    !(value instanceof FormData) && !(value instanceof Blob) && !(value instanceof File);
}

function sanitizeRecursive(
  obj: Record<string, unknown>,
  depth: number,
  removedByPath: string[]
): Record<string, unknown> {
  if (depth > MAX_DEPTH) return obj;

  const sanitized = { ...obj };

  SERVER_MANAGED_FIELDS.forEach((field) => {
    if (field in sanitized) {
      delete sanitized[field];
      removedByPath.push(depth === 0 ? field : `*.${field}`);
    }
  });

  for (const [key, value] of Object.entries(sanitized)) {
    if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map((item) =>
        isPlainObject(item) ? sanitizeRecursive(item, depth + 1, removedByPath) : item
      );
    } else if (isPlainObject(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeRecursive(value, depth + 1, removedByPath);
    }
  }

  return sanitized;
}

/**
 * Sanitiza payload removiendo campos server-managed (y en objetos anidados).
 * No aplica a FormData, Blob, File. En DEV solo se loguean los nombres de campos removidos, no el payload.
 *
 * @param payload - Objeto a sanitizar
 * @returns Payload sin campos server-managed
 */
export function sanitizePayload<T extends Record<string, unknown>>(payload: T): T {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  if (
    payload instanceof FormData ||
    payload instanceof Blob ||
    payload instanceof File ||
    Array.isArray(payload)
  ) {
    return payload;
  }

  const removedByPath: string[] = [];
  const sanitized = sanitizeRecursive(payload, 0, removedByPath) as T;

  if (removedByPath.length > 0 && import.meta.env.DEV) {
    console.warn(
      '[PayloadSanitizer] Campos server-managed removidos:',
      [...new Set(removedByPath)].join(', ')
    );
  }

  return sanitized;
}

