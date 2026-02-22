import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, ExternalLink, Ticket } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './Button';
import { reportarError } from '@/services/endpoints/support.api';
import { useErrorReportStore } from '@/store';
import { buildReportMessage, formatErrorMessageForDisplay } from '@/shared/errors';

export function ErrorReportModal() {
  const { t } = useTranslation();
  const { isOpen, context, close, clear } = useErrorReportStore();
  const [copied, setCopied] = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const [reportSuccess, setReportSuccess] = useState<{ key: string; url: string } | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setReportSending(false);
      setReportSuccess(null);
      setReportError(null);
    }
  }, [isOpen]);

  const referenceId = context?.referenceId ?? '';
  const reportMessage = useMemo(() => (context ? buildReportMessage(context) : ''), [context]);

  const handleCopy = async () => {
    if (!referenceId) return;
    try {
      await navigator.clipboard.writeText(referenceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.log('Reference ID:', referenceId);
    }
  };

  const handleReport = async () => {
    if (!context || reportSending || reportSuccess) return;
    setReportSending(true);
    setReportError(null);
    try {
      const result = await reportarError({
        referenceId: referenceId,
        message: reportMessage,
        url: context.url,
        userAgent: context.userAgent,
        timestamp: context.timestamp,
      });
      setReportSuccess({ key: result.key, url: result.url });
    } catch (err: unknown) {
      let msg: string | null = null;
      if (import.meta.env.DEV && err && typeof err === 'object') {
        const ax = err as { response?: { data?: { detail?: string }; status?: number }; message?: string };
        msg = ax.response?.data?.detail ?? (ax.response ? `HTTP ${ax.response.status}` : ax.message ?? 'Error de red');
      }
      setReportError(msg ?? t('errorReport.reportError'));
    } finally {
      setReportSending(false);
    }
  };

  const handleReportClick = () => {
    if (reportSuccess?.url) {
      window.open(reportSuccess.url, '_blank', 'noopener,noreferrer');
      return;
    }
    void handleReport();
  };

  const handleClose = () => {
    close();
    clear();
  };

  if (!context) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('errorReport.title', 'Se produjo un error')}
      size="lg"
      dataTracautoSolicitudModal
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-error" />
          </div>
          <div className="flex-1">
            <p className="text-text font-medium break-words">
              {formatErrorMessageForDisplay(context.message)}
            </p>
            <p className="text-text-muted text-sm mt-1">
              {t('errorReport.subtitle', 'Podés reportar el problema para que soporte lo investigue.')}
            </p>
          </div>
        </div>

        {(context.code || context.status) && (
          <div className="text-xs text-text-muted flex flex-wrap gap-2">
            {context.status != null && (
              <span className="px-2 py-1 rounded bg-background border border-border">
                {t('errorReport.status', 'Status')}: {context.status}
              </span>
            )}
            {context.code && (
              <span className="px-2 py-1 rounded bg-background border border-border">
                {t('errorReport.code', 'Code')}: {context.code}
              </span>
            )}
          </div>
        )}

        <div className="p-3 bg-background rounded-lg border border-border">
          <p className="text-xs text-text-muted mb-1">
            {t('errorReport.referenceId', 'ID de referencia')}
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-text font-semibold">
              {referenceId}
            </code>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-surface-hover transition-colors"
              title={t('common.copy', 'Copiar')}
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4 text-text-muted" />
              )}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {t('errorPages.referenceHint', 'Usá este código si contactás a soporte')}
          </p>
        </div>

        {import.meta.env.DEV && context.details && (
          <details className="text-left">
            <summary className="text-sm text-text-muted cursor-pointer hover:text-text">
              {t('errorReport.technicalDetails', 'Ver detalles técnicos')}
            </summary>
            <pre className="mt-2 p-3 bg-background rounded-lg text-xs text-error overflow-auto max-h-40 border border-border break-words whitespace-pre-wrap">
              {context.details.split('\n').map((line) => formatErrorMessageForDisplay(line)).join('\n')}
            </pre>
          </details>
        )}

        {reportSuccess && (
          <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-sm text-text">
            <p className="font-medium">{t('errorReport.reportSent', 'Reporte enviado. Ticket creado en Jira:')}</p>
            <a
              href={reportSuccess.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-primary hover:underline"
            >
              {reportSuccess.key}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {reportError && (
          <p className="text-sm text-error">{reportError}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={handleClose}>
            {t('common.close', 'Cerrar')}
          </Button>
          <Button
            onClick={handleReportClick}
            disabled={reportSending}
            className="flex items-center justify-center gap-2"
          >
            <Ticket className="w-4 h-4" />
            {reportSending
              ? t('errorReport.reportSending', 'Enviando reporte...')
              : reportSuccess
                ? t('errorReport.viewTicket', 'Ver ticket')
                : t('errorReport.reportProblem', 'Reportar problema')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
