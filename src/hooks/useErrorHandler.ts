/**
 * Centralized error handling hook for backend API errors.
 * 
 * Converts backend error codes to translated user-friendly messages
 * using i18next. Supports field-level validation errors.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/store/toast.store';
import { buildErrorReportContext, extractErrorDetails, isReportableError, openErrorReport } from '@/shared/errors';
import type { ProblemDetails } from '@/shared/types/api';

/**
 * Parsed error with translated message and metadata
 */
export interface ParsedError {
  /** Translated user-facing message */
  message: string;
  /** Original error code for debugging */
  code: string;
  /** HTTP status code */
  status: number;
  /** Trace ID for error correlation and support tickets */
  traceId?: string;
  /** Timestamp of when the error occurred */
  timestamp?: string;
  /** Retry-after in seconds (for rate limiting) */
  retryAfter?: number;
  /** Field-level validation errors (translated) */
  fieldErrors?: Record<string, string>;
}

export interface HandleApiErrorOptions {
  showToast?: boolean;
  showReportModal?: boolean;
  reportable?: boolean;
}

/**
 * Hook for translating backend errors to user-friendly messages.
 * 
 * Usage:
 * ```tsx
 * const { parseError, translateCode } = useErrorHandler();
 * 
 * try {
 *   await api.call();
 * } catch (err) {
 *   const parsed = parseError(err);
 *   showToast(parsed.message);
 * }
 * ```
 */
export function useErrorHandler() {
  const { t } = useTranslation();

  /**
   * Translates an error code to a localized message.
   * Falls back to the code itself if no translation exists.
   */
  const translateCode = useCallback(
    (code: string, args?: Record<string, unknown>): string => {
      // Try errors.{code} first (e.g., errors.Replay.RangoExcedido)
      const key = `errors.${code}`;
      const translated = t(key, args) as string;

      return translated === key ? code : translated;
    },
    [t]
  );

  /**
   * Parses a backend error response into a translated ParsedError.
   * Handles Axios errors, Response objects, and plain ProblemDetails.
   */
  const parseError = useCallback(
    (error: unknown): ParsedError => {
      // Default error
      const defaultError: ParsedError = {
        message: t('errors.unexpected'),
        code: 'errors.unexpected',
        status: 500,
      };

      // Handle null/undefined
      if (!error) {
        return defaultError;
      }

      // Extract ProblemDetails from various error shapes
      let problemDetails: ProblemDetails | null = null;

      // Axios-style error
      if (typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: ProblemDetails; status?: number } };
        problemDetails = axiosError.response?.data ?? null;
        if (!problemDetails) {
          return {
            ...defaultError,
            status: axiosError.response?.status ?? 500,
          };
        }
      }
      // Error from interceptor with ProblemDetails attached
      else if (typeof error === 'object' && 'problemDetails' in error) {
        const err = error as { problemDetails?: ProblemDetails };
        problemDetails = err.problemDetails ?? null;
      }
      // Direct ProblemDetails object
      else if (typeof error === 'object' && ('code' in error || 'status' in error)) {
        problemDetails = error as ProblemDetails;
      }
      // Error from interceptor (Error with code/status attached)
      else if (error instanceof Error) {
        const err = error as Error & { code?: string; status?: number };
        if (err.status != null || err.code != null) {
          const code = err.code ?? 'errors.client';
          const status = err.status ?? 0;
          const message = translateCode(code);
          return { message, code, status };
        }
        return {
          message: error.message || defaultError.message,
          code: 'errors.client',
          status: 0,
        };
      }

      if (!problemDetails) {
        return defaultError;
      }

      // Backend may send code in problemDetails.code (root) or problemDetails.extensions.code (RFC 7807)
      const extensions = (problemDetails as Record<string, unknown>).extensions as Record<string, unknown> | undefined;
      const code =
        (problemDetails.code as string | undefined) ??
        (typeof extensions?.code === 'string' ? extensions.code : null) ??
        'errors.unexpected';
      // Merge extensions (param0, param1, retryAfter) for i18n interpolation
      const interpolate = extensions ? { ...problemDetails, ...extensions } : (problemDetails as Record<string, unknown>);
      const translated = translateCode(code, interpolate);
      const message = translated === code && problemDetails.detail ? problemDetails.detail : translated;

      // Parse field-level validation errors
      let fieldErrors: Record<string, string> | undefined;
      if (problemDetails.errors) {
        fieldErrors = {};
        for (const [field, messages] of Object.entries(problemDetails.errors)) {
          // Take first error message per field
          const firstMessage = messages[0];
          // Try to translate if it looks like an error code
          fieldErrors[field] = firstMessage?.includes('.')
            ? translateCode(firstMessage)
            : firstMessage;
        }
      }

      return {
        message,
        code,
        status: problemDetails.status ?? 500,
        traceId: (problemDetails.traceId as string | undefined) ??
          (typeof extensions?.traceId === 'string' ? extensions.traceId : undefined),
        timestamp: (problemDetails.timestamp as string | undefined) ??
          (typeof extensions?.timestamp === 'string' ? extensions.timestamp : undefined),
        retryAfter: (problemDetails.retryAfter as number | undefined) ??
          (typeof extensions?.retryAfter === 'number' ? extensions.retryAfter : undefined),
        fieldErrors,
      };
    },
    [t, translateCode]
  );

  /**
   * Manejo unificado de errores de API.
   * Abre modal de reporte para errores graves y muestra toast para errores funcionales.
   */
  const handleApiError = useCallback(
    (error: unknown, options: HandleApiErrorOptions = {}): ParsedError => {
      const parsed = parseError(error);
      const reportable = options.reportable ?? isReportableError(parsed);
      const showReportModal = options.showReportModal ?? true;
      const showToast = options.showToast ?? !reportable;

      if (reportable && showReportModal) {
        openErrorReport(buildErrorReportContext({
          message: parsed.message,
          code: parsed.code,
          status: parsed.status,
          traceId: parsed.traceId,
          timestamp: parsed.timestamp,
          details: extractErrorDetails(error),
          referenceId: parsed.traceId,
        }));
      }

      if (showToast) {
        toast.error(parsed.message);
      }

      return parsed;
    },
    [parseError]
  );

  /**
   * Quick helper to get translated message from an error.
   * Shorthand for parseError(error).message
   */
  const getErrorMessage = useCallback(
    (error: unknown): string => parseError(error).message,
    [parseError]
  );

  return {
    parseError,
    translateCode,
    getErrorMessage,
    handleApiError,
  };
}
