import { useErrorReportStore } from '@/store/errorReport.store';
import type { ErrorReportContext, ErrorReportInput } from './types';

const MAX_REFERENCE_ID = 50;
const MAX_MESSAGE_LENGTH = 1800;

export function generateReferenceId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function normalizeReferenceId(value?: string): string {
  if (!value || !value.trim()) return generateReferenceId();
  const trimmed = value.trim();
  if (trimmed.length <= MAX_REFERENCE_ID) return trimmed;
  return trimmed.slice(-MAX_REFERENCE_ID);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

/**
 * Acorta URLs de módulos en mensajes de error para evitar scroll lateral.
 * Ej: "Failed to fetch dynamically imported module: http://localhost:5173/src/features/vehicles/pages/VehiclesPage.tsx"
 *  -> "Failed to fetch dynamically imported module: vehicles/pages/VehiclesPage.tsx"
 */
export function formatErrorMessageForDisplay(message: string): string {
  if (!message || !message.trim()) return message;

  const dynamicImportPrefix = 'Failed to fetch dynamically imported module:';
  const idx = message.indexOf(dynamicImportPrefix);
  if (idx === -1) return message;

  const afterPrefix = message.slice(idx + dynamicImportPrefix.length).trim();
  const firstToken = afterPrefix.split(/\s/)[0] ?? '';
  if (!firstToken) return message;

  let pathname = '';
  try {
    const url = new URL(firstToken);
    pathname = url.pathname || '';
  } catch {
    // Puede ser un path relativo sin origen
    pathname = firstToken.startsWith('/') ? firstToken : `/${firstToken}`;
  }

  // Extraer path corto: /src/features/vehicles/pages/VehiclesPage.tsx -> vehicles/pages/VehiclesPage.tsx
  const srcFeaturesMatch = pathname.match(/\/src\/features\/(.+)$/);
  const srcMatch = pathname.match(/\/src\/(.+)$/);
  const shortPath = srcFeaturesMatch ? srcFeaturesMatch[1] : srcMatch ? srcMatch[1] : pathname.replace(/^\//, '');
  const suffix = afterPrefix.length > firstToken.length ? afterPrefix.slice(firstToken.length) : '';
  return `${dynamicImportPrefix} ${shortPath}${suffix}`.trim();
}

export function extractErrorDetails(error: unknown): string | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    if (error.stack) return error.stack;
    if (error.message) return error.message;
  }

  const problemError = error as { problemDetails?: { detail?: string } };
  if (problemError?.problemDetails?.detail) {
    return problemError.problemDetails.detail;
  }

  const axiosError = error as { response?: { data?: { detail?: string } } };
  if (axiosError?.response?.data?.detail) {
    return axiosError.response.data.detail;
  }

  return undefined;
}

export function buildErrorReportContext(input: ErrorReportInput): ErrorReportContext {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  return {
    referenceId: normalizeReferenceId(input.referenceId ?? input.traceId),
    message: input.message,
    code: input.code,
    status: input.status,
    traceId: input.traceId,
    timestamp: input.timestamp ?? new Date().toISOString(),
    details: input.details,
    url,
    userAgent,
  };
}

export function buildReportMessage(context: ErrorReportContext): string {
  const lines: string[] = [];

  lines.push(context.message);
  lines.push('');
  lines.push(`Status: ${context.status ?? 'n/a'}`);
  lines.push(`Code: ${context.code ?? 'n/a'}`);
  lines.push(`TraceId: ${context.traceId ?? context.referenceId}`);

  if (context.details) {
    lines.push('');
    lines.push('Details:');
    lines.push(context.details.split('\n').slice(0, 10).join('\n'));
  }

  return truncate(lines.join('\n'), MAX_MESSAGE_LENGTH);
}

export function openErrorReport(input: ErrorReportInput): ErrorReportContext {
  const store = useErrorReportStore.getState();
  const context = buildErrorReportContext(input);

  if (store.isOpen && store.context?.referenceId === context.referenceId) {
    return context;
  }

  store.open(context);
  return context;
}
