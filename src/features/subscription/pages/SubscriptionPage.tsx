import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Layers3, Package, Power, PowerOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmationModal,
  EstadoError,
  Spinner,
} from '@/shared/ui';
import { useAuthStore } from '@/store';
import { useSuscripcionesData } from '../hooks/useSubscriptionData';
import type { ModuloDisponibleDto } from '../types';

export function SuscripcionPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    modulosActivos,
    modulosDisponibles,
    isLoading,
    error,
    activarModulo,
    desactivarModulo,
    refetch,
  } = useSuscripcionesData();
  const [pendingAction, setPendingAction] = useState<{
    modulo: ModuloDisponibleDto;
    action: 'activate' | 'deactivate';
  } | null>(null);
  const isPersonalContext =
    user?.contextoActivo?.tipo === 'Personal' ||
    (!!user && !user.organizationId);
  const canManageModules = !isPersonalContext && ['Admin', 'SuperAdmin'].includes(user?.rol ?? '');
  const contextName = user?.contextoActivo?.nombre ?? (
    isPersonalContext
      ? t('subscription.personal.accountName', { defaultValue: 'Mi cuenta' })
      : t('subscription.organizationName', { defaultValue: 'Organizacion' })
  );

  const activos = useMemo(
    () => new Set(modulosActivos.map((modulo) => modulo.codigo)),
    [modulosActivos],
  );
  const contextSupportLabel = (value: string) => {
    if (value === 'Personal') return 'Personal';
    if (value === 'Organizacion') return t('subscription.context.organization', { defaultValue: 'Organizacion' });
    if (value === 'Ambos') return t('subscription.context.both', { defaultValue: 'Personal y organizacion' });
    return value;
  };

  const handleConfirm = () => {
    if (!pendingAction) return;

    const mutation = pendingAction.action === 'activate' ? activarModulo : desactivarModulo;
    mutation.mutate(pendingAction.modulo.codigo, {
      onSuccess: () => setPendingAction(null),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <EstadoError mensaje={(error as Error).message ?? t('common.error')} onReintentar={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">
          {isPersonalContext ? t('subscription.personal.title', { defaultValue: 'Modulos disponibles' }) : t('subscription.title')}
        </h1>
        <p className="mt-1 text-text-muted">
          {isPersonalContext
            ? t('subscription.personal.subtitle', { defaultValue: 'Consulta los modulos habilitados para tu contexto personal y las capacidades operativas que exponen.' })
            : t('subscription.subtitle')}
        </p>
      </div>

      <Alert
        type="info"
        message={
          isPersonalContext
            ? t('subscription.personal.info', { defaultValue: 'Estas viendo el catalogo de tu contexto personal. Aca solo aparecen modulos y alcances que aplican a tu cuenta, sin mezclar nada empresarial.' })
            : `${t('subscription.info')} ${t('subscription.organization.infoSuffix', { defaultValue: 'La gestion sigue atada a la organizacion activa:' })} ${contextName}.`
        }
      />

      <Card>
        <CardHeader
          title={isPersonalContext ? t('subscription.personal.contextTitle', { defaultValue: 'Donde estas parado' }) : t('subscription.organization.contextTitle', { defaultValue: 'Contexto de catalogo activo' })}
          subtitle={isPersonalContext ? t('subscription.personal.contextSubtitle', { defaultValue: 'La disponibilidad y visibilidad se resuelven para tu cuenta personal.' }) : t('subscription.organization.contextSubtitle', { defaultValue: 'Las acciones de gestion afectan solo a la organizacion seleccionada.' })}
        />
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{isPersonalContext ? t('common.context.personal', { defaultValue: 'Personal' }) : t('common.context.organization', { defaultValue: 'Organizacion' })}</Badge>
          <Badge variant="default">{contextName}</Badge>
          <Badge variant={modulosActivos.length > 0 ? 'success' : 'default'}>
            {modulosActivos.length > 0
              ? t('subscription.activeModulesCount', { count: modulosActivos.length, defaultValue: `${modulosActivos.length} modulos activos` })
              : t('subscription.noActiveModulesShort', { defaultValue: 'Sin modulos activos' })}
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {modulosDisponibles.map((modulo) => {
          const isActive = activos.has(modulo.codigo) || modulo.estaActivo;
          const isBlocked = !modulo.cumplePrerequisitos;

          return (
            <Card key={modulo.codigo}>
              <CardHeader title={modulo.nombre} subtitle={modulo.descripcion} />
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={isActive ? 'success' : 'default'}>
                  {isActive ? t('subscription.status.active') : t('subscription.status.inactive')}
                  </Badge>
                  {modulo.esBase && <Badge variant="info">{t('subscription.badges.base')}</Badge>}
                  {modulo.esGratis && <Badge variant="info">{t('subscription.badges.included')}</Badge>}
                  <Badge variant="default">{contextSupportLabel(modulo.soporteContexto)}</Badge>
                  {modulo.esOperativo && (
                <Badge variant="success">{t('subscription.badges.operational')}</Badge>
              )}
                </div>

                {isBlocked && modulo.prerequisitosFaltantes.length > 0 && (
                  <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-text-muted">
                    <p className="mb-1 font-medium text-text">{t('subscription.missingPrerequisites')}</p>
                    <ul className="space-y-1">
                      {modulo.prerequisitosFaltantes.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Package size={16} />
                    <span>
                      {modulo.esOperativo
                        ? t('subscription.availability.enabled')
                        : t('subscription.availability.disabled')}
                    </span>
                  </div>

                  {!canManageModules ? (
                    <Badge variant="default">
                      {isPersonalContext
                        ? t('subscription.availableForAccount', { defaultValue: 'Disponible segun tu cuenta' })
                        : t('subscription.noManagement', { defaultValue: 'Sin gestion' })}
                    </Badge>
                  ) : isActive ? (
                    <Button
                      variant="outline"
                      onClick={() => setPendingAction({ modulo, action: 'deactivate' })}
                      disabled={desactivarModulo.isPending || modulo.esBase || !modulo.puedeGestionarse}
                    >
                      <PowerOff size={16} className="mr-2" />
                      {t('subscription.actions.deactivate')}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setPendingAction({ modulo, action: 'activate' })}
                      disabled={activarModulo.isPending || isBlocked || !modulo.puedeActivarse}
                    >
                      <Power size={16} className="mr-2" />
                      {t('subscription.actions.activate')}
                    </Button>
                  )}
                </div>
              </div>
              </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader
          title={t('subscription.activeModulesTitle')}
          subtitle={t('subscription.activeModulesSubtitle')}
        />
        <div className="flex flex-wrap gap-2">
          {modulosActivos.length > 0 ? (
            modulosActivos.map((modulo) => (
              <Badge key={modulo.codigo} variant="success">
                <Check size={14} className="mr-1" />
                {modulo.nombre}
              </Badge>
            ))
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                {isPersonalContext
                  ? t('subscription.personal.noActiveModules', { defaultValue: 'Todavia no hay modulos personales operativos. Revisa el catalogo y usa este contexto como punto de partida.' })
                  : t('subscription.noActiveModules')}
              </p>
              <Link
                to="/"
                className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark"
              >
                <Layers3 size={14} className="mr-2" />
                Volver al dashboard
              </Link>
            </div>
          )}
        </div>
      </Card>

      <ConfirmationModal
        isOpen={!isPersonalContext && pendingAction != null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirm}
        title={
          pendingAction?.action === 'activate'
            ? t('subscription.confirm.activateTitle')
            : t('subscription.confirm.deactivateTitle')
        }
        description={
          pendingAction
            ? t(
                pendingAction.action === 'activate'
                  ? 'subscription.confirm.activateDescription'
                  : 'subscription.confirm.deactivateDescription',
                { modulo: pendingAction.modulo.nombre },
              )
            : ''
        }
        variant={pendingAction?.action === 'activate' ? 'info' : 'warning'}
        isLoading={activarModulo.isPending || desactivarModulo.isPending}
      />
    </div>
  );
}

