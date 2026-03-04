import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { isReportableError, openErrorReport } from '@/shared/errors';
import type { ParsedError } from '@/hooks';

interface ApiErrorBannerProps {
    /** The parsed error object (usually from useErrorHandler) */
    error: ParsedError | null;
    /** A clear label of the context to send to Jira (e.g., 'Error Creación Vehículo') */
    jiraLabel: string;
    /** Optionally close the modal or execute logic after clicking the report button */
    onReportClick?: () => void;
    /** Custom title for the error banner */
    title?: string;
}

export function ApiErrorBanner({
    error,
    jiraLabel,
    onReportClick,
    title
}: ApiErrorBannerProps) {
    const { t } = useTranslation();

    if (!error) return null;

    const reportable = isReportableError(error);
    const referenceId = error.traceId;

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                    {title && <h4 className="text-sm font-medium text-red-800">{title}</h4>}
                    <p className="text-sm text-red-700 mt-1">{error.message}</p>
                    {referenceId && (
                        <p className="text-xs text-red-600 mt-1 font-mono">ID: {referenceId}</p>
                    )}
                </div>
            </div>
            {reportable && (
                <div className="flex justify-end mt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-red-50 text-red-700 border-red-200"
                        onClick={() => {
                            openErrorReport({
                                referenceId,
                                message: jiraLabel ? `${jiraLabel}: ${error.message}` : error.message,
                                code: error.code,
                                status: error.status,
                                traceId: error.traceId,
                                timestamp: error.timestamp,
                            });
                            onReportClick?.();
                        }}
                    >
                        {t('common.reportErrorToJira', 'Reportar a Jira')}
                    </Button>
                </div>
            )}
        </div>
    );
}
