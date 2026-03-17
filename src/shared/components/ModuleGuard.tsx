/**
 * Guard component that restricts access based on active modules
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTenantStore } from '@/store';
import { ModuloSistema } from '@/shared/types/api';

interface ModuleGuardProps {
    /** Modules that are allowed to access this content (at least one must be active) */
    allowedModules: ModuloSistema[];
    /** Content to render if access is allowed */
    children: ReactNode;
    /** Path to redirect to if access is denied (default: '/') */
    redirectTo?: string;
    /** If true, shows 'access denied' message instead of redirecting */
    showAccessDenied?: boolean;
}

export function ModuleGuard({
    allowedModules,
    children,
    redirectTo = '/',
    showAccessDenied = false,
}: ModuleGuardProps) {
    const { t } = useTranslation();
    const { currentOrganization } = useTenantStore();

    // If no organization, redirect to login
    if (!currentOrganization) {
        return <Navigate to="/login" replace />;
    }

    // Check if organization has at least one of the allowed modules active
    const modulosActivos = currentOrganization.modulosActivos ?? [];
    const isAllowed = allowedModules.some(m => modulosActivos.includes(m));

    if (!isAllowed) {
        if (showAccessDenied) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                    <div className="text-6xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-text mb-2">
                        {t('common.accessDenied', 'Acceso Denegado')}
                    </h1>
                    <p className="text-text-muted max-w-md">
                        {t('common.noPermissionForModule', 'Tu organización no tiene acceso a este módulo.')}
                    </p>
                </div>
            );
        }
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
}
