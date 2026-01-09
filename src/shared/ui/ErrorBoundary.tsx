/**
 * Error Boundary para capturar errores de React no manejados.
 * Evita que un error en un componente rompa toda la aplicación.
 * 
 * Uso:
 * <ErrorBoundary>
 *   <ComponenteQuePuedeFallar />
 * </ErrorBoundary>
 * 
 * Con fallback personalizado:
 * <ErrorBoundary fallback={<MiComponenteDeError />}>
 *   <ComponenteQuePuedeFallar />
 * </ErrorBoundary>
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Ticket, Copy, Check } from 'lucide-react';
import { Button } from './Button';

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

// Genera un ID corto para el error (los primeros 8 caracteres de un UUID-like)
function generateErrorId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      errorId: '',
      timestamp: '',
      copied: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Actualiza el estado para mostrar el fallback en el próximo render
    return { 
      hasError: true, 
      error,
      errorId: generateErrorId(),
      timestamp: new Date().toISOString()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log del error para debugging
    console.error('[ErrorBoundary] Error capturado:', {
      errorId: this.state.errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: this.state.timestamp
    });

    // Guardar errorInfo en el estado
    this.setState({ errorInfo });

    // Callback opcional para logging externo (Sentry, LogRocket, etc.)
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    // Resetea el estado para intentar renderizar de nuevo
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: '',
      timestamp: '',
      copied: false
    });
  };

  handleGoHome = (): void => {
    // Navega al inicio y recarga para limpiar cualquier estado corrupto
    window.location.href = '/';
  };

  handleCopyErrorId = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(this.state.errorId);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Fallback si clipboard no está disponible
      console.log('Error ID:', this.state.errorId);
    }
  };

  handleCreateTicket = (): void => {
    // Por ahora solo logueamos la intención de crear ticket
    // En el futuro esto se conectará a Jira u otro sistema
    const ticketData = {
      errorId: this.state.errorId,
      timestamp: this.state.timestamp,
      message: this.state.error?.message,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    console.log('[ErrorBoundary] Crear ticket con datos:', ticketData);
    
    // TODO: Integrar con Jira/sistema de tickets
    // Por ahora mostramos un alert informativo
    alert(
      `🎫 Ticket (próximamente)\n\n` +
      `ID de referencia: ${this.state.errorId}\n` +
      `Error: ${this.state.error?.message}\n\n` +
      `Esta función se conectará próximamente a Jira.`
    );
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Si hay un fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { errorId, copied } = this.state;

      // Fallback por defecto
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-background">
          <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full shadow-lg">
            {/* Icono */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-error" />
              </div>
            </div>

            {/* Título y mensaje */}
            <h2 className="text-xl font-semibold text-text mb-2">
              Algo salió mal
            </h2>
            <p className="text-text-muted mb-4">
              Ocurrió un error inesperado. Podés intentar recargar la página o volver al inicio.
            </p>

            {/* ID de referencia */}
            <div className="mb-6 p-3 bg-background rounded-lg border border-border">
              <p className="text-xs text-text-muted mb-1">ID de referencia</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-sm font-mono text-text font-semibold">
                  {errorId}
                </code>
                <button
                  onClick={this.handleCopyErrorId}
                  className="p-1 rounded hover:bg-surface-hover transition-colors"
                  title="Copiar ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4 text-text-muted" />
                  )}
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Usá este código si contactás a soporte
              </p>
            </div>

            {/* Detalles del error (solo en desarrollo) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-text-muted cursor-pointer hover:text-text">
                  Ver detalles técnicos
                </summary>
                <pre className="mt-2 p-3 bg-background rounded-lg text-xs text-error overflow-auto max-h-32 border border-border">
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      {'\n\n'}
                      {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                    </>
                  )}
                </pre>
              </details>
            )}

            {/* Acciones principales */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Button
                variant="outline"
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Ir al Inicio
              </Button>
            </div>

            {/* Botón de crear ticket */}
            <button
              onClick={this.handleCreateTicket}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm text-text-muted hover:text-text hover:bg-background rounded-lg transition-colors border border-transparent hover:border-border"
            >
              <Ticket className="w-4 h-4" />
              Reportar problema
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
 * 
 * Uso:
 * const SafeComponent = withErrorBoundary(MyComponent);
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
