import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, Spinner } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import type { IngresosPeriodoItemDto } from '../types/reportes';
import { CHART_TOOLTIP_STYLE } from './GraficoUtilizacion';

interface GraficoIngresosProps {
  data: IngresosPeriodoItemDto[];
  moneda?: string;
  isLoading: boolean;
}

export function GraficoIngresos({ data, moneda = 'ARS', isLoading }: GraficoIngresosProps) {
  const { t } = useTranslation();

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        periodo: item.periodoLabel,
        ingresos: item.ingresos,
        reservas: item.cantidadReservas,
      })),
    [data],
  );

  return (
    <Card>
      <CardHeader
        title={t('alquileres.dashboard.graficos.ingresos')}
        subtitle={t('alquileres.dashboard.graficos.ingresosSubtitulo')}
      />
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">
          {t('alquileres.dashboard.graficos.sinDatos')}
        </p>
      ) : (
        <div className="px-2 pb-4" role="img" aria-label={t('alquileres.dashboard.graficoIngresos')}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="ingresosGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="periodo"
                stroke="var(--color-text-muted)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="var(--color-text-muted)"
                fontSize={12}
                tickFormatter={(v: number) => formatCurrency(v, moneda)}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number | string | undefined) => [formatCurrency(Number(value ?? 0), moneda), t('alquileres.dashboard.graficos.ingresos')]}
              />
              <Area
                type="monotone"
                dataKey="ingresos"
                stroke="var(--color-success)"
                fill="url(#ingresosGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
