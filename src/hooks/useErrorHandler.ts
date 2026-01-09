/**
 * Centralized error handling hook for backend API errors.
 * 
 * Converts backend error codes to translated user-friendly messages
 * using i18next. Supports field-level validation errors.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ProblemDetails response from backend
 * RFC 7807 compliant with TracAuto extensions
 */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  // TracAuto extensions
  code?: string;
  traceId?: string;
  timestamp?: string;
  retryAfter?: number;
  errors?: Record<string, string[]>; // FluentValidation errors
}

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
      // Use code as fallback if translation is missing (e.g. for raw validation messages)
      const translated = t(key, { defaultValue: code, ...args }) as string;

      return translated;
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
        message: t('errors.unexpected', { defaultValue: 'An unexpected error occurred' }),
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
      // Direct ProblemDetails object
      else if (typeof error === 'object' && ('code' in error || 'status' in error)) {
        problemDetails = error as ProblemDetails;
      }
      // Error message string
      else if (error instanceof Error) {
        return {
          message: error.message || defaultError.message,
          code: 'errors.client',
          status: 0,
        };
      }

      if (!problemDetails) {
        return defaultError;
      }

      // Extract code and translate
      const code = problemDetails.code ?? 'errors.unexpected';
      const message = translateCode(code, problemDetails as Record<string, unknown>);

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
        traceId: problemDetails.traceId,
        timestamp: problemDetails.timestamp,
        retryAfter: problemDetails.retryAfter,
        fieldErrors,
      };
    },
    [t, translateCode]
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
  };
}
