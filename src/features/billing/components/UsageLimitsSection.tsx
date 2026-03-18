import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import { Card, CardHeader } from '@/shared/ui';
import type { LimitesModuloDto, ModuloDisponibleDto } from '../types';

interface Props {
  usage: LimitesModuloDto[];
  modulosDisponibles: ModuloDisponibleDto[];
}

export function UsageLimitsSection({ usage, modulosDisponibles }: Props) {
  const { t } = useTranslation();

  if (usage.length === 0) return null;

  const getModuleName = (codigo: number) =>
    modulosDisponibles.find((m) => m.codigo === codigo)?.nombre ?? `Módulo ${codigo}`;

  return (
    <Card>
      <CardHeader
        title={t('billing.usage.title')}
        subtitle={t('billing.usage.subtitle')}
      />
      <div className="space-y-6">
        {usage.map((modulo) => (
          <div key={modulo.moduloSistema}>
            <h4 className="font-medium text-text mb-3">
              {getModuleName(modulo.moduloSistema)}
            </h4>
            <div className="space-y-3">
              {modulo.recursos.map((recurso) => {
                const isUnlimited = recurso.limite === 0;
                const percentage = isUnlimited ? 0 : recurso.porcentaje;
                const barColor = recurso.excedido
                  ? 'bg-error'
                  : percentage > 80
                    ? 'bg-warning'
                    : 'bg-primary';

                return (
                  <div key={recurso.recurso}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text">
                        {t(`billing.usage.resources.${recurso.recurso}`)}
                      </span>
                      <span className="text-sm text-text-muted">
                        {isUnlimited
                          ? `${recurso.actual} (${t('billing.usage.unlimited')})`
                          : `${recurso.actual} ${t('billing.usage.of')} ${recurso.limite}`}
                      </span>
                    </div>
                    {!isUnlimited && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${barColor}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    )}
                    {recurso.excedido && (
                      <p className="text-xs text-error mt-1">
                        {t('billing.usage.exceeded')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {modulo.recursos.some((r) => r.porcentaje > 80 && r.limite > 0) && (
              <div className="mt-3 flex items-center gap-2 text-warning">
                <TrendingUp size={14} />
                <span className="text-xs">{t('billing.usage.upgradeHint')}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
