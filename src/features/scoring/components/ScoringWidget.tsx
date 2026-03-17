import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Gauge, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '@/shared/ui/Card';
import { Spinner } from '@/shared/ui/Spinner';
import { Badge } from '@/shared/ui/Badge';
import { scoringApi } from '@/services/endpoints/scoring.api';
import { getCategoriaColor, getScoreColor } from '../utils/scoring.utils';

export function ScoringWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: resumen, isLoading } = useQuery({
    queryKey: ['scoring', 'resumen'],
    queryFn: () => scoringApi.obtenerResumenFlota(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader title={t('scoring.widget.titulo')} />
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (!resumen || resumen.totalConductoresConScore === 0) {
    return (
      <Card>
        <CardHeader title={t('scoring.widget.titulo')} />
        <div className="p-4 text-center text-text-muted text-sm">
          {t('scoring.sinDatos')}
        </div>
      </Card>
    );
  }

  const allDrivers = [
    ...resumen.top3Mejores,
    ...resumen.top3NecesitanAtencion,
  ].slice(0, 6);

  return (
    <Card>
      <CardHeader
        title={t('scoring.widget.titulo')}
        action={
          <button
            onClick={() => navigate('/scoring')}
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            {t('scoring.widget.verDetalle')}
            <ChevronRight className="w-4 h-4" />
          </button>
        }
      />
      <div className="p-4 space-y-4">
        {/* Score principal */}
        <div className="flex items-center justify-center gap-3">
          <Gauge className="w-8 h-8 text-primary" />
          <div className="text-center">
            <span className={`text-3xl font-bold ${getScoreColor(resumen.scorePromedioFlota)}`}>
              {resumen.scorePromedioFlota}
            </span>
            <span className="text-lg text-text-muted">/100</span>
            <p className="text-xs text-text-muted">{t('scoring.widget.scoreFlota')}</p>
          </div>
        </div>

        {/* Mini ranking */}
        <div className="space-y-2">
          {allDrivers.map((c) => (
            <div
              key={c.conductorId}
              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-surface/80 cursor-pointer transition-colors"
              onClick={() => navigate(`/scoring/conductores/${c.conductorId}`)}
            >
              <span className="text-sm text-text truncate max-w-[140px]">
                {c.conductorNombre}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${getScoreColor(c.scoreGeneral)}`}>
                  {c.scoreGeneral}
                </span>
                {c.tendencia > 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : c.tendencia < 0 ? (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                ) : null}
                <Badge className={`text-xs ${getCategoriaColor(c.categoria)}`}>
                  {t(`scoring.categoria.${c.categoria}`)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
