import { useTranslation } from 'react-i18next';
import { CreditCard, Building2, Landmark } from 'lucide-react';
import { GatewayPago } from '../types';

interface GatewaySelectorProps {
  value: GatewayPago;
  onChange: (gateway: GatewayPago) => void;
}

const GATEWAY_OPTIONS = [
  {
    value: GatewayPago.Stripe,
    icon: CreditCard,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-500',
  },
  {
    value: GatewayPago.MercadoPago,
    icon: Building2,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-500',
  },
  {
    value: GatewayPago.Transferencia,
    icon: Landmark,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
  },
] as const;

export function GatewaySelector({ value, onChange }: GatewaySelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-3">
      {GATEWAY_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;
        const gatewayKey = GatewayPago[option.value].toLowerCase();

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`relative flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-all ${
              isSelected
                ? `${option.borderColor} ${option.bgColor}`
                : 'border-border bg-surface hover:border-border-hover hover:bg-surface-hover'
            }`}
          >
            <div className={`mt-0.5 rounded-lg p-2 ${isSelected ? option.bgColor : 'bg-surface-secondary'}`}>
              <Icon size={20} className={isSelected ? option.color : 'text-text-muted'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text">
                  {t(`billing.gateway.${gatewayKey}.name`)}
                </span>
                {isSelected && (
                  <span className={`inline-flex h-2 w-2 rounded-full ${option.borderColor.replace('border-', 'bg-')}`} />
                )}
              </div>
              <p className="mt-0.5 text-sm text-text-muted">
                {t(`billing.gateway.${gatewayKey}.description`)}
              </p>
              <p className="mt-1 text-xs text-text-muted/70">
                {t(`billing.gateway.${gatewayKey}.detail`)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
