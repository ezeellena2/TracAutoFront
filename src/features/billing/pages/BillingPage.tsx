import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Package,
  Calendar,
  DollarSign,
  ExternalLink,
  Power,
  PowerOff,
  Plus,
  Minus,
  Clock,
  Building2,
  Landmark,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Badge,
  Button,
  Spinner,
  EstadoError,
  ConfirmationModal,
  Alert,
  KPICard,
} from '@/shared/ui';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import { useBillingData } from '../hooks/useBillingData';
import { UsageLimitsSection } from '../components/UsageLimitsSection';
import { CheckoutModal } from '../components/CheckoutModal';
import {
  EstadoSuscripcion,
  GatewayPago,
  PeriodoFacturacion,
  type ModuloDisponibleDto,
} from '../types';

/** Dominios permitidos para redirección de billing (Stripe + MercadoPago) */
const ALLOWED_BILLING_DOMAINS = [
  'checkout.stripe.com',
  'billing.stripe.com',
  'dashboard.stripe.com',
  'www.mercadopago.com',
  'www.mercadopago.com.ar',
  'www.mercadopago.com.mx',
  'www.mercadopago.com.br',
];

function isAllowedBillingUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      ALLOWED_BILLING_DOMAINS.some(
        (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
      )
    );
  } catch {
    return false;
  }
}

function useEstadoBadge(estado?: EstadoSuscripcion) {
  const { t } = useTranslation();

  const config: Record<EstadoSuscripcion, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
    [EstadoSuscripcion.Trial]: { label: t('billing.estado.trial'), variant: 'info' },
    [EstadoSuscripcion.Activa]: { label: t('billing.estado.activa'), variant: 'success' },
    [EstadoSuscripcion.PausadaPorFaltaDePago]: { label: t('billing.estado.pausada'), variant: 'warning' },
    [EstadoSuscripcion.Cancelada]: { label: t('billing.estado.cancelada'), variant: 'error' },
    [EstadoSuscripcion.Expirada]: { label: t('billing.estado.expirada'), variant: 'error' },
    [EstadoSuscripcion.PendienteVerificacionPago]: { label: t('billing.estado.pendienteVerificacion'), variant: 'warning' },
  };

  if (!estado) return null;
  return config[estado] ?? null;
}

function GatewayBadge({ gateway }: { gateway?: GatewayPago }) {
  const { t } = useTranslation();
  if (gateway === undefined || gateway === null) return null;

  const config: Record<GatewayPago, { icon: typeof CreditCard; label: string }> = {
    [GatewayPago.Ninguno]: { icon: Package, label: t('billing.gateway.ninguno.name') },
    [GatewayPago.Stripe]: { icon: CreditCard, label: t('billing.gateway.stripe.name') },
    [GatewayPago.MercadoPago]: { icon: Building2, label: t('billing.gateway.mercadopago.name') },
    [GatewayPago.Transferencia]: { icon: Landmark, label: t('billing.gateway.transferencia.name') },
  };

  const { icon: Icon, label } = config[gateway] ?? config[GatewayPago.Ninguno];

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
      <Icon size={14} />
      {label}
    </span>
  );
}

export function BillingPage() {
  const { t } = useTranslation();
  const {
    subscription,
    plans,
    modulosActivos,
    modulosDisponibles,
    usage,
    isLoading,
    error,
    cancelSubscription,
    reactivateSubscription,
    crearSuscripcion,
    activarModulo,
    desactivarModulo,
    openBillingPortal,
    openCheckoutSession,
    refetch,
  } = useBillingData();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [moduloToToggle, setModuloToToggle] = useState<{ modulo: ModuloDisponibleDto; action: 'activate' | 'deactivate' } | null>(null);

  const estadoBadge = useEstadoBadge(subscription?.estado);

  const handleOpenBillingPortal = async () => {
    try {
      const result = await openBillingPortal(window.location.href);
      if (!isAllowedBillingUrl(result.url)) return;
      window.location.href = result.url;
    } catch {
      // Error handled by React Query
    }
  };

  const handleOpenCheckout = async () => {
    try {
      const successUrl = `${window.location.origin}/suscripcion?checkout=success`;
      const cancelUrl = `${window.location.origin}/suscripcion?checkout=cancel`;
      const result = await openCheckoutSession(successUrl, cancelUrl);
      if (!isAllowedBillingUrl(result.url)) return;
      window.location.href = result.url;
    } catch {
      // Error handled by React Query
    }
  };

  const handleCancelSubscription = () => {
    cancelSubscription.mutate(undefined, {
      onSuccess: () => setShowCancelModal(false),
    });
  };

  const handleReactivate = () => {
    reactivateSubscription.mutate();
  };

  const handleToggleModulo = () => {
    if (!moduloToToggle) return;
    const { modulo, action } = moduloToToggle;
    const mutation = action === 'activate' ? activarModulo : desactivarModulo;
    mutation.mutate(modulo.codigo, {
      onSuccess: () => setModuloToToggle(null),
    });
  };

  const isCancelled = subscription?.estado === EstadoSuscripcion.Cancelada;
  const isTrial = subscription?.estado === EstadoSuscripcion.Trial;
  const isPaused = subscription?.estado === EstadoSuscripcion.PausadaPorFaltaDePago;
  const isPendienteVerificacion = subscription?.estado === EstadoSuscripcion.PendienteVerificacionPago;
  const hasSubscription = !!subscription;
  const isGatewayWithPortal = subscription?.gateway === GatewayPago.Stripe;
  const isGatewayWithCheckout = subscription?.gateway === GatewayPago.Stripe || subscription?.gateway === GatewayPago.MercadoPago;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">{t('billing.title')}</h1>
        <p className="text-text-muted mt-1">{t('billing.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <EstadoError mensaje={(error as Error).message ?? t('common.error')} onReintentar={refetch} />
      ) : (
        <>
          {/* Alerts */}
          {isTrial && subscription?.fechaFinTrial && (
            <Alert type="info" message={t('billing.trialEndsOn', { date: new Date(subscription.fechaFinTrial).toLocaleDateString() })} />
          )}
          {isPaused && (
            <Alert type="warning" message={t('billing.pausedWarning')} />
          )}
          {isPendienteVerificacion && (
            <Alert type="warning" message={t('billing.pendienteVerificacionWarning')} />
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title={t('billing.status')}
              value={estadoBadge?.label ?? '-'}
              icon={CreditCard}
              color={estadoBadge?.variant === 'success' ? 'success' : estadoBadge?.variant === 'warning' ? 'warning' : estadoBadge?.variant === 'error' ? 'error' : 'primary'}
            />
            <KPICard
              title={t('billing.billingCycle')}
              value={
                subscription?.periodoFacturacion === PeriodoFacturacion.Anual
                  ? t('billing.billingCycleType.anual')
                  : t('billing.billingCycleType.mensual')
              }
              icon={Calendar}
              color="primary"
            />
            <KPICard
              title={t('billing.totalMonthly')}
              value={formatCurrency(subscription?.montoTotalMensual ?? 0, subscription?.moneda ?? 'ARS')}
              icon={DollarSign}
              color="warning"
            />
            <KPICard
              title={t('billing.modulesActive')}
              value={modulosActivos.length}
              icon={Package}
              color="success"
            />
          </div>

          {/* Gateway info (solo si hay suscripción) */}
          {hasSubscription && (
            <div className="flex items-center gap-4">
              <GatewayBadge gateway={subscription.gateway} />
              {!subscription.requierePago && (
                <Badge variant="info" size="sm">{t('billing.noPaymentRequired')}</Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <Card>
            <CardHeader
              title={t('billing.actions')}
              subtitle={t('billing.actionsSubtitle')}
            />
            <div className="flex flex-wrap gap-3">
              {/* Billing portal — solo Stripe */}
              {hasSubscription && isGatewayWithPortal && (
                <Button variant="outline" onClick={handleOpenBillingPortal}>
                  <ExternalLink size={16} className="mr-2" />
                  {t('billing.manageBilling')}
                </Button>
              )}

              {/* Checkout — para gateways con checkout externo (Stripe/MP) y suscripción existente sin pagar */}
              {hasSubscription && isGatewayWithCheckout && (isTrial || isPaused) && (
                <Button variant="outline" onClick={handleOpenCheckout}>
                  <CreditCard size={16} className="mr-2" />
                  {t('billing.completePayment')}
                </Button>
              )}

              {/* Suscribirse — sin suscripción */}
              {!hasSubscription && (
                <Button variant="primary" onClick={() => setShowCheckoutModal(true)}>
                  <CreditCard size={16} className="mr-2" />
                  {t('billing.subscribe')}
                </Button>
              )}

              {/* Pendiente verificación — mostrar estado */}
              {isPendienteVerificacion && (
                <Button variant="outline" disabled>
                  <Clock size={16} className="mr-2" />
                  {t('billing.awaitingVerification')}
                </Button>
              )}

              {isCancelled && (
                <Button
                  variant="primary"
                  onClick={handleReactivate}
                  isLoading={reactivateSubscription.isPending}
                >
                  <Power size={16} className="mr-2" />
                  {t('billing.reactivateSubscription')}
                </Button>
              )}

              {hasSubscription && !isCancelled && !isPendienteVerificacion && (
                <Button
                  variant="danger"
                  onClick={() => setShowCancelModal(true)}
                >
                  <PowerOff size={16} className="mr-2" />
                  {t('billing.cancelSubscription')}
                </Button>
              )}
            </div>
          </Card>

          {/* Uso vs Límites */}
          <UsageLimitsSection usage={usage} modulosDisponibles={modulosDisponibles} />

          {/* Modules */}
          {modulosDisponibles.length > 0 && (
            <Card>
              <CardHeader
                title={t('billing.modules')}
                subtitle={t('billing.modulesSubtitle')}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modulosDisponibles.map((modulo) => (
                  <div
                    key={modulo.codigo}
                    className={`rounded-lg border p-4 transition-colors ${
                      modulo.estaActivo
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-surface'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-text">{modulo.nombre}</h4>
                          {modulo.estaActivo && (
                            <Badge variant="success" size="sm">{t('billing.active')}</Badge>
                          )}
                          {modulo.esBase && (
                            <Badge variant="info" size="sm">{t('billing.included')}</Badge>
                          )}
                          {modulo.esGratis && !modulo.esBase && (
                            <Badge variant="default" size="sm">{t('billing.free')}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-text-muted mt-1">{modulo.descripcion}</p>
                      </div>
                    </div>

                    {!modulo.esBase && (
                      <div className="mt-3">
                        {modulo.estaActivo ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setModuloToToggle({ modulo, action: 'deactivate' })}
                          >
                            <Minus size={14} className="mr-1" />
                            {t('billing.moduleRemove')}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModuloToToggle({ modulo, action: 'activate' })}
                            disabled={!modulo.cumplePrerequisitos}
                          >
                            <Plus size={14} className="mr-1" />
                            {t('billing.moduleAdd')}
                          </Button>
                        )}

                        {!modulo.cumplePrerequisitos && !modulo.estaActivo && modulo.prerequisitosFaltantes.length > 0 && (
                          <p className="text-xs text-warning mt-1">
                            {t('billing.prerequisitesMissing', { modules: modulo.prerequisitosFaltantes.join(', ') })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Active modules detail */}
          {modulosActivos.length > 0 && (
            <Card>
              <CardHeader
                title={t('billing.activeModulesDetail')}
                subtitle={t('billing.activeModulesDetailSubtitle')}
              />
              <div className="divide-y divide-border">
                {modulosActivos.map((modulo) => (
                  <div key={modulo.codigo} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-text">{modulo.nombre}</p>
                      <p className="text-sm text-text-muted">
                        {t('billing.activatedOn', { date: new Date(modulo.fechaActivacion).toLocaleDateString() })}
                      </p>
                    </div>
                    <Badge variant="success" size="sm">{t('billing.active')}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Checkout Modal */}
          <CheckoutModal
            isOpen={showCheckoutModal}
            onClose={() => setShowCheckoutModal(false)}
            plans={plans}
            crearSuscripcion={(req) => crearSuscripcion.mutateAsync(req)}
            openCheckoutSession={openCheckoutSession}
            isCreating={crearSuscripcion.isPending}
          />

          {/* Cancel confirmation modal */}
          <ConfirmationModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            onConfirm={handleCancelSubscription}
            title={t('billing.confirmCancel')}
            description={t('billing.cancelInfo')}
            confirmText={t('billing.cancelSubscription')}
            cancelText={t('common.cancel')}
            variant="danger"
            isLoading={cancelSubscription.isPending}
          />

          {/* Module toggle confirmation modal */}
          <ConfirmationModal
            isOpen={!!moduloToToggle}
            onClose={() => setModuloToToggle(null)}
            onConfirm={handleToggleModulo}
            title={
              moduloToToggle?.action === 'activate'
                ? t('billing.confirmActivateModule', { name: moduloToToggle?.modulo.nombre })
                : t('billing.confirmDeactivateModule', { name: moduloToToggle?.modulo.nombre })
            }
            description={
              moduloToToggle?.action === 'activate'
                ? t('billing.activateModuleInfo')
                : t('billing.deactivateModuleInfo')
            }
            variant={moduloToToggle?.action === 'deactivate' ? 'warning' : 'info'}
            isLoading={activarModulo.isPending || desactivarModulo.isPending}
          />
        </>
      )}
    </div>
  );
}
