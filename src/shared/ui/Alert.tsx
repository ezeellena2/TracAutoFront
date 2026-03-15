import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export type AlertType = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
    type: AlertType;
    message: string;
    className?: string;
    children?: React.ReactNode;
    onRetry?: () => void;
    retryLabel?: string;
}

const alertConfig = {
    error: {
        icon: AlertCircle,
        containerClass: 'text-error bg-error/10 border border-error/20',
        iconClass: 'text-error'
    },
    success: {
        icon: CheckCircle,
        containerClass: 'text-success bg-success/10 border border-success/20',
        iconClass: 'text-success'
    },
    warning: {
        icon: AlertTriangle,
        containerClass: 'text-warning bg-warning/10 border border-warning/20',
        iconClass: 'text-warning'
    },
    info: {
        icon: Info,
        containerClass: 'text-info bg-info/10 border border-info/20',
        iconClass: 'text-info'
    }
};

/**
 * Componente genérico para mostrar mensajes inline en formularios o secciones.
 * A diferencia de ApiErrorBanner (que es para reportar bugs al backend), 
 * Alert es puramente visual y pensado para validaciones de usuario.
 */
export function Alert({ type, message, className = '', children, onRetry, retryLabel }: AlertProps) {
    const { t } = useTranslation();
    const config = alertConfig[type];
    const Icon = config.icon;

    return (
        <div className={`flex flex-col gap-2 p-3 rounded-md ${config.containerClass} ${className}`}>
            <div className="flex items-start gap-2">
                <Icon className={`w-5 h-5 shrink-0 mt-[1px] ${config.iconClass}`} />
                <div className="flex-1">
                    <span className="text-sm font-medium">{message}</span>
                    
                    {onRetry && (
                        <div className="mt-2 text-right">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={onRetry}
                                className="shadow-sm"
                            >
                                {retryLabel || t('common.retry')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            {children && (
                <div className="pl-7">
                    {children}
                </div>
            )}
        </div>
    );
}
