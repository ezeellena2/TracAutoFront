/**
 * Error Boundary para capturar errores de React no manejados.
 * Evita que un error en un componente rompa toda la aplicación.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Ticket, Copy, Check } from 'lucide-react';
import i18next from 'i18next';
import { Button } from './Button';
import { openErrorReport, extractErrorDetails, formatErrorMessageForDisplay, generateReferenceId } from '@/shared/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Componente personalizado para mostrar en caso de error */
  fallback?: ReactNode;
  /** Callback opcional cuando ocurre un error (para logging externo) */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  timestamp: string;
  copied: boolean;
}


export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorId: '',
      timestamp: '',
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateReferenceId(),
      timestamp: new Date().toISOString(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log del error para debugging
    console.error('[ErrorBoundary] Error capturado:', {
      errorId: this.state.errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: this.state.timestamp,
    });

    // Guardar errorInfo en el estado
    this.setState({ errorInfo });

    // Callback opcional para logging externo (Sentry, LogRocket, etc.)
    this.props.onError?.(error, errorInfo);

    // El modal de reporte solo se abre cuando el usuario hace clic en "Reportar problema" (handleOpenReport).
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: '',
      timestamp: '',
      copied: false,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleCopyErrorId = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(this.state.errorId);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      console.log('Error ID:', this.state.errorId);
    }
  };

  handleOpenReport = (): void => {
    openErrorReport({
      referenceId: this.state.errorId,
      message: this.state.error?.message || i18next.t('errors.unexpected'),
      code: 'errors.client',
      status: 0,
      timestamp: this.state.timestamp,
      details: extractErrorDetails(this.state.error),
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { errorId, copied } = this.state;
      const t = i18next.t.bind(i18next);

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-background">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full shadow-lg">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-text mb-2">
              {t('errorBoundary.title', 'Algo salió mal')}
            </h2>
            <p className="text-text-muted mb-4">
              {t('errorBoundary.message', 'Ocurrió un error inesperado. Podés intentar recargar la página o volver al inicio.')}
            </p>

            <div className="mb-6 p-3 bg-background rounded-lg border border-border">
              <p className="text-xs text-text-muted mb-1">
                {t('errorBoundary.referenceId', 'ID de referencia')}
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-sm font-mono text-text font-semibold">
                  {errorId}
                </code>
                <button
                  onClick={this.handleCopyErrorId}
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
                {t('errorBoundary.referenceHint', 'Usá este código si contactás a soporte')}
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-text-muted cursor-pointer hover:text-text">
                  {t('errorBoundary.technicalDetails', 'Ver detalles técnicos')}
                </summary>
                <pre className="mt-2 p-3 bg-background rounded-lg text-xs text-error overflow-auto max-h-32 border border-border break-words whitespace-pre-wrap">
                  {formatErrorMessageForDisplay(this.state.error.message)}
                  {this.state.error.stack && (
                    <>
                      {'\n\n'}
                      {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Button
                variant="outline"
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t('common.retry', 'Reintentar')}
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                {t('common.goHome', 'Ir al Inicio')}
              </Button>
            </div>

            <button
              onClick={this.handleOpenReport}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm text-text-muted hover:text-text hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border"
            >
              <Ticket className="w-4 h-4" />
              {t('errorBoundary.reportProblem', 'Reportar problema')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC para envolver componentes con ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}
