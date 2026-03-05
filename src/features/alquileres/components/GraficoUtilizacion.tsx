import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, Spinner } from '@/shared/ui';
import type { UtilizacionFlotaItemDto } from '../types/reportes';

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '12px',
};

interface GraficoUtilizacionProps {
  data: UtilizacionFlotaItemDto[];
  isLoading: boolean;
}

export function GraficoUtilizacion({ data, isLoading }: GraficoUtilizacionProps) {
  const { t } = useTranslation();

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        nombre: item.categoria != null
          ? t(`alquileres.flota.categorias.${item.categoria}`)
          : (item.vehiculoInfo ?? ''),
        ocupacion: item.porcentajeOcupacion,
        reservas: item.totalReservas,
        diasAlquilados: item.diasAlquilados,
        totalDias: item.totalDias,
      })),
    [data, t],
  );

  return (
    <Card>
      <CardHeader
        title={t('alquileres.dashboard.graficos.utilizacion')}
        subtitle={t('alquileres.dashboard.graficos.utilizacionSubtitulo')}
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
        <div className="px-2 pb-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v: number) => `${v}%`}
                stroke="var(--color-text-muted)"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="nombre"
                width={100}
                stroke="var(--color-text-muted)"
                fontSize={12}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number | string | undefined) => [`${Number(value ?? 0).toFixed(1)}%`, t('alquileres.dashboard.graficos.ocupacion')]}
              />
              <Bar
                dataKey="ocupacion"
                fill="var(--color-primary)"
                radius={[0, 4, 4, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
