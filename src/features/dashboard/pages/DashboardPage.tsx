import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers3, Sparkles } from 'lucide-react';
import { Card, CardHeader, Badge } from '@/shared/ui';
import { useAuthStore, useTenantStore } from '@/store';
import { resolveDashboardNavigation } from '@/app/navigation/navigationRegistry';
import { usePermissions } from '@/hooks';
import { ModuloSistema } from '@/shared/types/api';

const moduloBadgeKeys: Partial<Record<ModuloSistema, string>> = {
  [ModuloSistema.Flota]: 'dashboard.moduleLabels.flota',
  [ModuloSistema.Marketplace]: 'dashboard.moduleLabels.marketplace',
};

export function DashboardPage() {
  const { t } = useTranslation();
  const { currentOrganization } = useTenantStore();
  const { user } = useAuthStore();
  const { can, role } = usePermissions();

  const modulosActivos =
    user?.contextoActivo?.modulosActivos
    ?? currentOrganization?.modulosActivos
    ?? [];

  const isPersonalContext =
    user?.contextoActivo?.tipo === 'Personal' ||
    (!!user && !user.organizationId);

  const quickLinks = useMemo(
    () => resolveDashboardNavigation({ user, currentOrganization, can, role }),
    [can, currentOrganization, role, user],
  );
  const availableContexts = user?.contextosDisponibles ?? [];
  const contextSummary = isPersonalContext
    ? t('dashboard.personal.contextSummary', { defaultValue: 'Estas usando tu contexto personal. Todo lo que ves aca corresponde a recursos propios y modulos habilitados para tu cuenta.' })
    : t('dashboard.organization.contextSummary', { defaultValue: 'Estas operando dentro de una organizacion. La visibilidad y las acciones se recalculan segun el contexto activo y tus permisos reales.' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">
          {isPersonalContext ? t('dashboard.personal.title', { defaultValue: 'Mi espacio personal' }) : t('dashboard.title')}
        </h1>
        <p className="mt-1 text-text-muted">
          {isPersonalContext
            ? t('dashboard.personal.subtitle', { defaultValue: 'Gestiona tus recursos propios y revisa los modulos disponibles para tu contexto personal.' })
            : t('dashboard.subtitle')}
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader
          title={isPersonalContext ? (user?.contextoActivo?.nombre || user?.nombre || 'Personal') : (currentOrganization?.name ?? 'TracAuto')}
          subtitle={isPersonalContext ? t('dashboard.personal.activeContext', { defaultValue: 'Contexto activo: personal' }) : t('organization.preferences.subtitle')}
        />
        <div className="space-y-4">
          <p className="text-sm text-text-muted">{contextSummary}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">
              {isPersonalContext
                ? t('common.context.personal', { defaultValue: 'Personal' })
                : t('common.context.organization', { defaultValue: 'Organizacion' })}
            </Badge>
            <Badge variant="default">
              {availableContexts.length > 1
                ? t('dashboard.contextsAvailable', { count: availableContexts.length, defaultValue: `${availableContexts.length} contextos disponibles` })
                : t('dashboard.oneOperationalContext', { defaultValue: '1 contexto operativo' })}
            </Badge>
            <Badge variant={modulosActivos.length > 0 ? 'success' : 'default'}>
              {modulosActivos.length > 0
                ? t('dashboard.activeModulesCount', { count: modulosActivos.length, defaultValue: `${modulosActivos.length} modulos activos` })
                : t('dashboard.noActiveModules', { defaultValue: 'Sin modulos activos' })}
            </Badge>
          </div>
          {modulosActivos.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {modulosActivos.map((modulo) => (
                <Badge key={modulo} variant="success">
                  {t(moduloBadgeKeys[modulo as ModuloSistema] ?? 'dashboard.moduleLabels.unknown', {
                    defaultValue: String(modulo),
                  })}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted">
              {t('dashboard.noModulesHint', { defaultValue: 'Todavia no hay modulos operativos para este contexto. Revisa el catalogo antes de asumir que una pantalla deberia estar disponible.' })}
            </div>
          )}
        </div>
      </Card>

      {quickLinks.length === 0 ? (
        <Card>
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Sparkles size={20} />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-text">
                  {t('dashboard.noQuickLinksTitle', { defaultValue: 'Todavia no hay accesos operativos para mostrar' })}
                </h2>
                <p className="max-w-2xl text-sm text-text-muted">
                  {t('dashboard.noQuickLinksDescription', { defaultValue: 'Este contexto tiene sesion valida, pero todavia no expone modulos o rutas utiles para operar. Revisa el catalogo y, si corresponde, cambia de contexto desde el selector superior.' })}
                </p>
              </div>
            </div>
            <Link
              to="/suscripcion"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary-dark"
            >
              <Layers3 size={16} className="mr-2" />
              {t('dashboard.viewCatalog', { defaultValue: 'Ver catalogo' })}
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {quickLinks.map(({ key, path, icon: Icon, labelKey, descriptionKey }) => (
            <Link
              key={key}
              to={path!}
              className="group block min-w-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card
                padding="none"
                className="h-full min-w-0 overflow-hidden transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex h-full flex-col gap-3 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary" aria-hidden>
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium leading-snug text-text break-words transition-colors group-hover:text-primary">
                        {t(labelKey)}
                      </p>
                      <p className="text-sm leading-relaxed text-text-muted">
                        {t(descriptionKey, { defaultValue: '' })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-xs font-medium text-primary">
                    <span className="font-mono break-all" title={path}>{path}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
