import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from '@/store/toast.store';
import { Button, Badge } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import { GatewaySelector } from './GatewaySelector';
import {
  GatewayPago,
  PeriodoFacturacion,
  type PlanModuloDto,
  type CrearSuscripcionRequest,
  type CheckoutSessionDto,
} from '../types';

/** Dominios permitidos para redirección de checkout */
const ALLOWED_CHECKOUT_DOMAINS = [
  'checkout.stripe.com',
  'billing.stripe.com',
  'www.mercadopago.com',
  'www.mercadopago.com.ar',
  'www.mercadopago.com.mx',
  'www.mercadopago.com.br',
];

function isAllowedCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      ALLOWED_CHECKOUT_DOMAINS.some(
        (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
      )
    );
  } catch {
    return false;
  }
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: PlanModuloDto[];
  crearSuscripcion: (request: CrearSuscripcionRequest) => Promise<unknown>;
  openCheckoutSession: (successUrl: string, cancelUrl: string) => Promise<CheckoutSessionDto>;
  isCreating: boolean;
}

type Step = 'modules' | 'config' | 'confirm';
const STEPS: Step[] = ['modules', 'config', 'confirm'];

export function CheckoutModal({
  isOpen,
  onClose,
  plans,
  crearSuscripcion,
  openCheckoutSession,
  isCreating,
}: CheckoutModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('modules');
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());
  const [periodo, setPeriodo] = useState<PeriodoFacturacion>(PeriodoFacturacion.Mensual);
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [gateway, setGateway] = useState<GatewayPago>(GatewayPago.Stripe);
  const [isProcessing, setIsProcessing] = useState(false);

  // Agrupar planes default (pre-seleccionados) y opcionales
  const defaultPlanIds = useMemo(
    () => new Set(plans.filter((p) => p.esDefault && p.activo).map((p) => p.id)),
    [plans],
  );

  const activePlans = useMemo(() => plans.filter((p) => p.activo), [plans]);

  // Auto-seleccionar defaults al abrir
  const effectiveSelection = useMemo(() => {
    const merged = new Set(selectedPlanIds);
    defaultPlanIds.forEach((id) => merged.add(id));
    return merged;
  }, [selectedPlanIds, defaultPlanIds]);

  const selectedPlans = useMemo(
    () => activePlans.filter((p) => effectiveSelection.has(p.id)),
    [activePlans, effectiveSelection],
  );

  const totalMensual = useMemo(() => {
    return selectedPlans.reduce((sum, p) => {
      if (periodo === PeriodoFacturacion.Anual) {
        return sum + (moneda === 'ARS' ? p.precioAnualArs / 12 : p.precioAnualUsd / 12);
      }
      return sum + (moneda === 'ARS' ? p.precioMensualArs : p.precioMensualUsd);
    }, 0);
  }, [selectedPlans, periodo, moneda]);

  const totalPeriodo = useMemo(() => {
    return selectedPlans.reduce((sum, p) => {
      if (periodo === PeriodoFacturacion.Anual) {
        return sum + (moneda === 'ARS' ? p.precioAnualArs : p.precioAnualUsd);
      }
      return sum + (moneda === 'ARS' ? p.precioMensualArs : p.precioMensualUsd);
    }, 0);
  }, [selectedPlans, periodo, moneda]);

  const togglePlan = (planId: string) => {
    if (defaultPlanIds.has(planId)) return; // No se puede deseleccionar defaults
    const next = new Set(selectedPlanIds);
    if (next.has(planId)) next.delete(planId);
    else next.add(planId);
    setSelectedPlanIds(next);
  };

  const stepIndex = STEPS.indexOf(step);
  const canGoNext =
    step === 'modules' ? effectiveSelection.size > 0 :
    step === 'config' ? true :
    false;

  const goNext = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx]);
  };

  const goBack = () => {
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) setStep(STEPS[prevIdx]);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const request: CrearSuscripcionRequest = {
        modulos: selectedPlans.map((p) => ({
          moduloSistema: p.moduloSistema,
          planModuloId: p.id,
        })),
        periodoFacturacion: periodo,
        moneda,
        gateway,
      };

      await crearSuscripcion(request);

      // Flujo post-creación según gateway
      if (gateway === GatewayPago.Stripe || gateway === GatewayPago.MercadoPago) {
        try {
          const successUrl = `${window.location.origin}/suscripcion?checkout=success`;
          const cancelUrl = `${window.location.origin}/suscripcion?checkout=cancel`;
          const session = await openCheckoutSession(successUrl, cancelUrl);

          if (isAllowedCheckoutUrl(session.url)) {
            window.location.href = session.url;
            return;
          }
          // Si la URL no pasa validación, la suscripción se creó igual
          toast.success(t('billing.checkout.created'));
        } catch {
          // Suscripción creada pero fallo al abrir checkout — el usuario puede reintentar desde BillingPage
          toast.success(t('billing.checkout.createdNoRedirect'));
        }
      } else if (gateway === GatewayPago.Transferencia) {
        toast.success(t('billing.checkout.transferenciaPendiente'));
      }

      handleClose();
    } catch {
      // Error handled by React Query mutation
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('modules');
    setSelectedPlanIds(new Set());
    setPeriodo(PeriodoFacturacion.Mensual);
    setMoneda('ARS');
    setGateway(GatewayPago.Stripe);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  const busy = isCreating || isProcessing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-surface shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-text">{t('billing.checkout.title')}</h2>
          <div className="mt-2 flex gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  i <= stepIndex ? 'text-primary' : 'text-text-muted'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    i < stepIndex
                      ? 'bg-primary text-white'
                      : i === stepIndex
                        ? 'border-2 border-primary text-primary'
                        : 'border border-border text-text-muted'
                  }`}
                >
                  {i < stepIndex ? <Check size={10} /> : i + 1}
                </span>
                {t(`billing.checkout.step.${s}`)}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 'modules' && (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">{t('billing.checkout.selectModules')}</p>
              {activePlans.map((plan) => {
                const isDefault = defaultPlanIds.has(plan.id);
                const isSelected = effectiveSelection.has(plan.id);
                const precio = moneda === 'ARS' ? plan.precioMensualArs : plan.precioMensualUsd;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => togglePlan(plan.id)}
                    disabled={isDefault}
                    className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface hover:border-border-hover'
                    } ${isDefault ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                            isSelected ? 'border-primary bg-primary' : 'border-border'
                          }`}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <span className="font-medium text-text">
                          {t(`modules.${plan.moduloSistema}`, { defaultValue: `Módulo ${plan.moduloSistema}` })}
                        </span>
                        {isDefault && (
                          <Badge variant="info" size="sm">{t('billing.included')}</Badge>
                        )}
                      </div>
                      <span className="text-sm font-medium text-text-muted">
                        {precio === 0
                          ? t('billing.free')
                          : `${formatCurrency(precio, moneda)}/mes`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 'config' && (
            <div className="space-y-6">
              {/* Periodo */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-text">{t('billing.checkout.selectPeriod')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {([PeriodoFacturacion.Mensual, PeriodoFacturacion.Anual] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriodo(p)}
                      className={`rounded-lg border-2 p-3 text-center transition-all ${
                        periodo === p
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-surface hover:border-border-hover'
                      }`}
                    >
                      <span className="font-medium text-text">
                        {t(`billing.billingCycleType.${p === PeriodoFacturacion.Mensual ? 'mensual' : 'anual'}`)}
                      </span>
                      {p === PeriodoFacturacion.Anual && (
                        <p className="mt-0.5 text-xs text-success">{t('billing.checkout.annualDiscount')}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Moneda */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-text">{t('billing.checkout.selectCurrency')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(['ARS', 'USD'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMoneda(m)}
                      className={`rounded-lg border-2 p-3 text-center transition-all ${
                        moneda === m
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-surface hover:border-border-hover'
                      }`}
                    >
                      <span className="font-medium text-text">{m}</span>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {t(`billing.checkout.currency.${m.toLowerCase()}`)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gateway */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-text">{t('billing.checkout.selectGateway')}</h3>
                <GatewaySelector value={gateway} onChange={setGateway} />
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <p className="text-sm text-text-muted">{t('billing.checkout.reviewSummary')}</p>

              {/* Módulos seleccionados */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="text-sm font-medium text-text mb-2">{t('billing.checkout.selectedModules')}</h4>
                <div className="space-y-1.5">
                  {selectedPlans.map((plan) => {
                    const precio =
                      periodo === PeriodoFacturacion.Anual
                        ? moneda === 'ARS' ? plan.precioAnualArs : plan.precioAnualUsd
                        : moneda === 'ARS' ? plan.precioMensualArs : plan.precioMensualUsd;

                    return (
                      <div key={plan.id} className="flex justify-between text-sm">
                        <span className="text-text">
                          {t(`modules.${plan.moduloSistema}`, { defaultValue: `Módulo ${plan.moduloSistema}` })}
                        </span>
                        <span className="text-text-muted">
                          {precio === 0 ? t('billing.free') : formatCurrency(precio, moneda)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 border-t border-border pt-3 flex justify-between font-medium">
                  <span className="text-text">
                    {t(`billing.checkout.total.${periodo === PeriodoFacturacion.Anual ? 'anual' : 'mensual'}`)}
                  </span>
                  <span className="text-text">{formatCurrency(totalPeriodo, moneda)}</span>
                </div>
                {periodo === PeriodoFacturacion.Anual && (
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>{t('billing.checkout.equivalentMonthly')}</span>
                    <span>{formatCurrency(totalMensual, moneda)}/mes</span>
                  </div>
                )}
              </div>

              {/* Config resumen */}
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t('billing.checkout.period')}</span>
                  <span className="text-text font-medium">
                    {t(`billing.billingCycleType.${periodo === PeriodoFacturacion.Mensual ? 'mensual' : 'anual'}`)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t('billing.checkout.currencyLabel')}</span>
                  <span className="text-text font-medium">{moneda}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">{t('billing.checkout.paymentMethod')}</span>
                  <span className="text-text font-medium">
                    {t(`billing.gateway.${GatewayPago[gateway].toLowerCase()}.name`)}
                  </span>
                </div>
              </div>

              {/* Nota de trial */}
              <div className="rounded-lg bg-info/10 border border-info/20 p-3">
                <p className="text-sm text-info">
                  {gateway === GatewayPago.Transferencia
                    ? t('billing.checkout.transferenciaNote')
                    : t('billing.checkout.trialNote')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between">
          <div>
            {stepIndex > 0 && (
              <Button variant="ghost" onClick={goBack} disabled={busy}>
                <ChevronLeft size={16} className="mr-1" />
                {t('common.goBack')}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={busy}>
              {t('common.cancel')}
            </Button>
            {step !== 'confirm' ? (
              <Button variant="primary" onClick={goNext} disabled={!canGoNext}>
                {t('common.next')}
                <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleConfirm} disabled={busy}>
                {busy && <Loader2 size={16} className="mr-2 animate-spin" />}
                {t('billing.checkout.confirm')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
