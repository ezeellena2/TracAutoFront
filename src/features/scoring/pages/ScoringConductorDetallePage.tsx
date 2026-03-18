import { useTranslation, getI18n } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Button } from '@/shared/ui/Button';
import { Card, CardHeader } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Spinner } from '@/shared/ui/Spinner';
import { EstadoError } from '@/shared/ui/EstadoError';
import { useScoringConductorDetalle } from '../hooks/useScoringConductorDetalle';
import { getCategoriaColor, getScoreColor, getScoreBarColor } from '../utils/scoring.utils';

export function ScoringConductorDetallePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { historial, ultimoScore, isLoading, error, periodo, setPeriodo } =
    useScoringConductorDetalle(id!);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <EstadoError mensaje={t('scoring.errorCargar')} onReintentar={() => navigate(0)} />;
  }

  if (!ultimoScore) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/scoring')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {t('common.volver')}
        </Button>
        <p className="text-text-muted">{t('scoring.sinDatosDetalle')}</p>
      </div>
    );
  }

  const desglose = [
    { label: t('scoring.velocidad'), score: ultimoScore.scoreVelocidad, eventos: ultimoScore.eventosVelocidad },
    { label: t('scoring.frenado'), score: ultimoScore.scoreFrenado, eventos: ultimoScore.eventosFrenado },
    { label: t('scoring.aceleracion'), score: ultimoScore.scoreAceleracion, eventos: ultimoScore.eventosAceleracion },
    { label: t('scoring.geocercas'), score: ultimoScore.scoreGeocercas, eventos: ultimoScore.eventosGeocerca },
    { label: t('scoring.horasConduccion'), score: ultimoScore.scoreHorasConduccion, eventos: ultimoScore.minutosConduccion },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/scoring')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text">{ultimoScore.conductorNombre}</h1>
          <p className="text-text-muted">{t('scoring.detalleSubtitulo')}</p>
        </div>
        <div className="text-right">
          <span className={`text-4xl font-bold ${getScoreColor(ultimoScore.scoreGeneral)}`}>
            {ultimoScore.scoreGeneral}
          </span>
          <span className="text-xl text-text-muted">/100</span>
          <div className="mt-1">
            <Badge className={getCategoriaColor(ultimoScore.categoria)}>
              {t(`scoring.categoria.${ultimoScore.categoria}`)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Desglose de scores */}
      <Card>
        <CardHeader title={t('scoring.desglose')} />
        <div className="p-4 space-y-4">
          {desglose.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-text">{item.label}</span>
                <span className={`font-bold ${getScoreColor(item.score)}`}>{item.score}/100</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-2 rounded-full transition-all ${getScoreBarColor(item.score)}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Chart historico */}
      <Card>
        <CardHeader
          title={t('scoring.historico')}
          action={
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    periodo === p
                      ? 'bg-primary text-white'
                      : 'bg-surface text-text-muted hover:bg-surface/80'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          }
        />
        <div className="p-4">
          {historial && historial.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historial}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="fecha"
                  stroke="var(--color-text-muted)"
                  fontSize={12}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString(getI18n().language, { day: '2-digit', month: 'short' })
                  }
                />
                <YAxis domain={[0, 100]} stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip
                  labelFormatter={(v) => new Date(v).toLocaleDateString(getI18n().language)}
                />
                <Line
                  type="monotone"
                  dataKey="scoreGeneral"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name={t('scoring.scoreGeneral')}
                />
                <Line
                  type="monotone"
                  dataKey="scoreVelocidad"
                  stroke="#059669"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name={t('scoring.velocidad')}
                />
                <Line
                  type="monotone"
                  dataKey="scoreFrenado"
                  stroke="#d97706"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name={t('scoring.frenado')}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-muted text-center py-8">{t('scoring.sinHistorico')}</p>
          )}
        </div>
      </Card>

      {/* Metricas del ultimo dia */}
      <Card>
        <CardHeader title={t('scoring.metricasDia')} />
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-text">
              {ultimoScore.kilometrosRecorridos.toFixed(1)}
            </p>
            <p className="text-sm text-text-muted">{t('scoring.kmRecorridos')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text">
              {Math.round(ultimoScore.minutosConduccion / 60)}h {ultimoScore.minutosConduccion % 60}m
            </p>
            <p className="text-sm text-text-muted">{t('scoring.tiempoConduccion')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text">
              {ultimoScore.velocidadMaximaRegistrada.toFixed(0)} km/h
            </p>
            <p className="text-sm text-text-muted">{t('scoring.velocidadMaxima')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text">
              {ultimoScore.velocidadPromedioKmh.toFixed(0)} km/h
            </p>
            <p className="text-sm text-text-muted">{t('scoring.velocidadPromedio')}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
