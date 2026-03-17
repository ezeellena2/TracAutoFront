import { useTranslation, getI18n } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Gauge, TrendingUp, TrendingDown, AlertTriangle, Trophy } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { KPICard } from '@/shared/ui/KPICard';
import { Card, CardHeader } from '@/shared/ui/Card';
import { Spinner } from '@/shared/ui/Spinner';
import { EstadoError } from '@/shared/ui/EstadoError';
import { EstadoVacio } from '@/shared/ui/EstadoVacio';
import { Badge } from '@/shared/ui/Badge';
import { useScoringDashboard } from '../hooks/useScoringDashboard';
import { getCategoriaColor, getCategoriaChartColor, getScoreColor } from '../utils/scoring.utils';

export function ScoringDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resumen, conductores, isLoading, error, refetch } = useScoringDashboard();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <EstadoError mensaje={t('scoring.errorCargar')} onReintentar={refetch} />;
  }

  if (!resumen || resumen.totalConductoresConScore === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">{t('scoring.titulo')}</h1>
        <EstadoVacio
          titulo={t('scoring.sinDatos')}
          descripcion={t('scoring.sinDatosDescripcion')}
        />
      </div>
    );
  }

  const distribucionData = Object.entries(resumen.distribucionPorCategoria).map(
    ([categoria, cantidad]) => ({
      name: t(`scoring.categoria.${categoria}`),
      value: cantidad,
      color: getCategoriaChartColor(categoria),
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">{t('scoring.titulo')}</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('scoring.scorePromedio')}
          value={`${resumen.scorePromedioFlota}/100`}
          icon={Gauge}
          color="primary"
        />
        <KPICard
          title={t('scoring.conductoresTotal')}
          value={resumen.totalConductoresConScore}
          icon={Trophy}
          color="success"
        />
        <KPICard
          title={t('scoring.conductoresRiesgo')}
          value={
            (resumen.distribucionPorCategoria['Riesgoso'] ?? 0) +
            (resumen.distribucionPorCategoria['Critico'] ?? 0)
          }
          icon={AlertTriangle}
          color="warning"
        />
        <KPICard
          title={t('scoring.conductoresExcelentes')}
          value={resumen.distribucionPorCategoria['Excelente'] ?? 0}
          icon={TrendingUp}
          color="success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribucion por categoria */}
        <Card>
          <CardHeader title={t('scoring.distribucion')} />
          <div className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={distribucionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {distribucionData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Tendencia semanal */}
        <Card>
          <CardHeader title={t('scoring.tendenciaSemanal')} />
          <div className="p-4">
            {resumen.tendenciaUltimas4Semanas.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={resumen.tendenciaUltimas4Semanas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="inicioSemana"
                    stroke="var(--color-text-muted)"
                    fontSize={12}
                    tickFormatter={(v) => new Date(v).toLocaleDateString(getI18n().language, { day: '2-digit', month: 'short' })}
                  />
                  <YAxis domain={[0, 100]} stroke="var(--color-text-muted)" fontSize={12} />
                  <Tooltip
                    labelFormatter={(v) => new Date(v).toLocaleDateString(getI18n().language, { day: '2-digit', month: 'short' })}
                  />
                  <Line
                    type="monotone"
                    dataKey="scorePromedio"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name={t('scoring.scorePromedio')}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-muted text-center py-8">{t('scoring.sinTendencia')}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Top 3 Mejores / Necesitan Atencion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title={t('scoring.topMejores')} />
          <div className="p-4 space-y-3">
            {resumen.top3Mejores.map((c, i) => (
              <div
                key={c.conductorId}
                className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface/80 cursor-pointer"
                onClick={() => navigate(`/scoring/conductores/${c.conductorId}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-text-muted">#{i + 1}</span>
                  <span className="font-medium text-text">{c.conductorNombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getScoreColor(c.scoreGeneral)}`}>
                    {c.scoreGeneral}
                  </span>
                  <Badge className={getCategoriaColor(c.categoria)}>
                    {t(`scoring.categoria.${c.categoria}`)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title={t('scoring.necesitanAtencion')} />
          <div className="p-4 space-y-3">
            {resumen.top3NecesitanAtencion.map((c) => (
              <div
                key={c.conductorId}
                className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface/80 cursor-pointer"
                onClick={() => navigate(`/scoring/conductores/${c.conductorId}`)}
              >
                <span className="font-medium text-text">{c.conductorNombre}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getScoreColor(c.scoreGeneral)}`}>
                    {c.scoreGeneral}
                  </span>
                  <Badge className={getCategoriaColor(c.categoria)}>
                    {t(`scoring.categoria.${c.categoria}`)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Ranking completo */}
      {conductores && conductores.items.length > 0 && (
        <Card>
          <CardHeader title={t('scoring.rankingCompleto')} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-text-muted font-medium">#</th>
                  <th className="text-left p-3 text-text-muted font-medium">{t('scoring.conductor')}</th>
                  <th className="text-center p-3 text-text-muted font-medium">{t('scoring.score')}</th>
                  <th className="text-center p-3 text-text-muted font-medium">{t('scoring.categoriaLabel')}</th>
                  <th className="text-center p-3 text-text-muted font-medium">{t('scoring.tendencia')}</th>
                </tr>
              </thead>
              <tbody>
                {conductores.items.map((c, i) => (
                  <tr
                    key={c.conductorId}
                    className="border-b border-border/50 hover:bg-surface cursor-pointer"
                    onClick={() => navigate(`/scoring/conductores/${c.conductorId}`)}
                  >
                    <td className="p-3 text-text-muted">{i + 1}</td>
                    <td className="p-3 font-medium text-text">{c.conductorNombre}</td>
                    <td className={`p-3 text-center font-bold ${getScoreColor(c.scoreGeneral)}`}>
                      {c.scoreGeneral}/100
                    </td>
                    <td className="p-3 text-center">
                      <Badge className={getCategoriaColor(c.categoria)}>
                        {t(`scoring.categoria.${c.categoria}`)}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      {c.tendencia > 0 ? (
                        <span className="text-emerald-600 flex items-center justify-center gap-1">
                          <TrendingUp className="w-4 h-4" /> +{c.tendencia}
                        </span>
                      ) : c.tendencia < 0 ? (
                        <span className="text-red-600 flex items-center justify-center gap-1">
                          <TrendingDown className="w-4 h-4" /> {c.tendencia}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
