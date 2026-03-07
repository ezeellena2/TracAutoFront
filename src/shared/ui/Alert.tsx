import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type AlertType = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
    type: AlertType;
    message: string;
    className?: string;
    children?: React.ReactNode;
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
export function Alert({ type, message, className = '', children }: AlertProps) {
    const config = alertConfig[type];
    const Icon = config.icon;

    return (
        <div className={`flex flex-col gap-2 p-3 rounded-md ${config.containerClass} ${className}`}>
            <div className="flex items-start gap-2">
                <Icon className={`w-5 h-5 shrink-0 mt-[1px] ${config.iconClass}`} />
                <span className="text-sm font-medium">{message}</span>
            </div>
            {children && (
                <div className="pl-5.5">
                    {children}
                </div>
            )}
        </div>
    );
}
