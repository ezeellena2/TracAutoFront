/**
 * Guard component that restricts access based on active modules
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useTenantStore } from '@/store';
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
  const { user } = useAuthStore();
  const isPersonalContext = user?.contextoActivo?.tipo === 'Personal';
  const modulosActivos =
    user?.contextoActivo?.modulosActivos
    ?? currentOrganization?.modulosActivos
    ?? [];

  if (!isPersonalContext && !currentOrganization) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          unauthorized: true,
          from: isPersonalContext ? 'personal-context' : 'missing-organization',
        }}
      />
    );
  }

  const isAllowed = allowedModules.some((moduleCode) => modulosActivos.includes(moduleCode));

  if (!isAllowed) {
    if (showAccessDenied) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 text-6xl">Bloq</div>
          <h1 className="mb-2 text-2xl font-bold text-text">
            {t('common.accessDenied', 'Acceso Denegado')}
          </h1>
          <p className="max-w-md text-text-muted">
            {t('common.noPermissionForModule', 'Este contexto no tiene acceso a este modulo.')}
          </p>
        </div>
      );
    }

    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
