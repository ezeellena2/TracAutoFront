export interface ErrorPolicyInput {
  status?: number;
  code?: string;
}

const NON_REPORTABLE_CODES = new Set([
  'network',
  'errors.network',
  'HTTP_400',
  'HTTP_401',
  'HTTP_403',
  'HTTP_404',
  'HTTP_409',
  'HTTP_429',
  'HTTP_503',
  'Seguridad.OperacionCancelada',
]);

export function isReportableError(error: ErrorPolicyInput): boolean {
  const status = error.status ?? 0;
  const code = error.code ?? '';

  if (NON_REPORTABLE_CODES.has(code)) return false;

  if (status >= 500) return true;

  if (code === 'errors.unexpected' || code === 'General.ErrorInterno' || code === 'errors.client' || code === 'HTTP_500') {
    return true;
  }

  if (status === 0) {
    return code !== 'network' && code !== 'errors.network';
  }

  return false;
}
