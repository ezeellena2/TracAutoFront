import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Card, CardHeader } from '@/shared/ui/Card';
import { Spinner } from '@/shared/ui/Spinner';
import { EstadoError } from '@/shared/ui/EstadoError';
import { usePermissions } from '@/hooks';
import { useScoringConfig } from '../hooks/useScoringConfig';
import type { ConfigurarScoringRequest } from '../types';

export function ScoringConfigPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canConfigurar = can('scoring:configurar');
  const { configuracion, isLoading, error, guardar, isGuardando } = useScoringConfig();

  const [form, setForm] = useState<ConfigurarScoringRequest>({
    habilitado: true,
    pesoVelocidad: 30,
    pesoFrenado: 25,
    pesoAceleracion: 20,
    pesoGeocercas: 15,
    pesoHorasConduccion: 10,
    umbralFrenadoBruscoMs2: 4.0,
    umbralAceleracionBruscaMs2: 3.5,
    maxHorasContinuasConduccion: 4,
    scoreMinimoAlerta: 40,
  });

  useEffect(() => {
    if (configuracion) {
      setForm({
        habilitado: configuracion.habilitado,
        pesoVelocidad: configuracion.pesoVelocidad,
        pesoFrenado: configuracion.pesoFrenado,
        pesoAceleracion: configuracion.pesoAceleracion,
        pesoGeocercas: configuracion.pesoGeocercas,
        pesoHorasConduccion: configuracion.pesoHorasConduccion,
        umbralFrenadoBruscoMs2: configuracion.umbralFrenadoBruscoMs2,
        umbralAceleracionBruscaMs2: configuracion.umbralAceleracionBruscaMs2,
        maxHorasContinuasConduccion: configuracion.maxHorasContinuasConduccion,
        scoreMinimoAlerta: configuracion.scoreMinimoAlerta,
      });
    }
  }, [configuracion]);

  const sumaPesos =
    form.pesoVelocidad + form.pesoFrenado + form.pesoAceleracion +
    form.pesoGeocercas + form.pesoHorasConduccion;

  const pesosValidos = sumaPesos === 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesosValidos) return;
    await guardar(form);
  };

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

  const pesos = [
    { key: 'pesoVelocidad' as const, label: t('scoring.velocidad') },
    { key: 'pesoFrenado' as const, label: t('scoring.frenado') },
    { key: 'pesoAceleracion' as const, label: t('scoring.aceleracion') },
    { key: 'pesoGeocercas' as const, label: t('scoring.geocercas') },
    { key: 'pesoHorasConduccion' as const, label: t('scoring.horasConduccion') },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/scoring')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-text">{t('scoring.configuracion')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Habilitado */}
        <Card>
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-text">{t('scoring.habilitado')}</p>
              <p className="text-sm text-text-muted">{t('scoring.habilitadoDesc')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.habilitado}
                onChange={(e) => setForm({ ...form, habilitado: e.target.checked })}
                disabled={!canConfigurar}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </Card>

        {/* Pesos */}
        <Card>
          <CardHeader title={t('scoring.pesos')} />
          <div className="p-4 space-y-4">
            {pesos.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-4">
                <label className="w-40 text-sm text-text">{label}</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                  disabled={!canConfigurar}
                  className="flex-1"
                />
                <span className="w-12 text-right font-mono text-sm text-text">{form[key]}%</span>
              </div>
            ))}
            <div className={`text-sm font-medium ${pesosValidos ? 'text-emerald-600' : 'text-red-600'}`}>
              {t('scoring.sumaPesos')}: {sumaPesos}/100
              {!pesosValidos && ` — ${t('scoring.pesosDebenSumar100')}`}
            </div>
          </div>
        </Card>

        {/* Umbrales */}
        <Card>
          <CardHeader title={t('scoring.umbrales')} />
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-text mb-1">{t('scoring.umbralFrenado')} (m/s²)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="20"
                value={form.umbralFrenadoBruscoMs2}
                onChange={(e) => setForm({ ...form, umbralFrenadoBruscoMs2: Number(e.target.value) })}
                disabled={!canConfigurar}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text"
              />
            </div>
            <div>
              <label className="block text-sm text-text mb-1">{t('scoring.umbralAceleracion')} (m/s²)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="20"
                value={form.umbralAceleracionBruscaMs2}
                onChange={(e) => setForm({ ...form, umbralAceleracionBruscaMs2: Number(e.target.value) })}
                disabled={!canConfigurar}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text"
              />
            </div>
            <div>
              <label className="block text-sm text-text mb-1">{t('scoring.maxHorasContinuas')}</label>
              <input
                type="number"
                min="1"
                max="24"
                value={form.maxHorasContinuasConduccion}
                onChange={(e) => setForm({ ...form, maxHorasContinuasConduccion: Number(e.target.value) })}
                disabled={!canConfigurar}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text"
              />
            </div>
            <div>
              <label className="block text-sm text-text mb-1">{t('scoring.scoreMinimoAlerta')}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.scoreMinimoAlerta}
                onChange={(e) => setForm({ ...form, scoreMinimoAlerta: Number(e.target.value) })}
                disabled={!canConfigurar}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-text"
              />
            </div>
          </div>
        </Card>

        {canConfigurar && (
          <Button type="submit" disabled={!pesosValidos || isGuardando} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {isGuardando ? t('common.guardando') : t('common.guardar')}
          </Button>
        )}
      </form>
    </div>
  );
}
