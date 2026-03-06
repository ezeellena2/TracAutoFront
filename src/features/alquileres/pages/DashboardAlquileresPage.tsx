import { useTranslation } from 'react-i18next';
import { Calendar, Car, DollarSign, TrendingUp } from 'lucide-react';
import { KPICard, Spinner, EstadoError } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import { useDashboardAlquileres } from '../hooks/useDashboardAlquileres';
import { GraficoUtilizacion } from '../components/GraficoUtilizacion';
import { GraficoIngresos } from '../components/GraficoIngresos';

export function DashboardAlquileresPage() {
  const { t } = useTranslation();
  const { estadisticas, utilizacion, ingresos, isLoading, error, refetch } = useDashboardAlquileres();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">{t('alquileres.dashboard.titulo')}</h1>
        <p className="text-text-muted mt-1">{t('alquileres.dashboard.subtitulo')}</p>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <EstadoError mensaje={(error as Error).message ?? t('common.error')} onReintentar={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title={t('alquileres.dashboard.kpi.totalReservas')}
              value={estadisticas?.totalReservas ?? 0}
              subtitle={t('alquileres.dashboard.kpi.totalReservasSubtitulo', {
                completadas: estadisticas?.tasaCompletadas?.toFixed(1) ?? '0',
              })}
              icon={Calendar}
              color="primary"
            />
            <KPICard
              title={t('alquileres.dashboard.kpi.vehiculosFlota')}
              value={utilizacion?.totalVehiculos ?? 0}
              subtitle={t('alquileres.dashboard.kpi.vehiculosFlotaSubtitulo', {
                total: utilizacion?.totalVehiculos ?? 0,
              })}
              icon={Car}
              color="success"
            />
            <KPICard
              title={t('alquileres.dashboard.kpi.ingresosMes')}
              value={formatCurrency(ingresos?.ingresosTotales ?? 0, ingresos?.moneda ?? 'ARS')}
              subtitle={t('alquileres.dashboard.kpi.ingresosMesSubtitulo', {
                reservas: ingresos?.totalReservas ?? 0,
              })}
              icon={DollarSign}
              color="warning"
            />
            <KPICard
              title={t('alquileres.dashboard.kpi.tasaOcupacion')}
              value={`${(utilizacion?.porcentajeOcupacionGlobal ?? 0).toFixed(1)}%`}
              subtitle={t('alquileres.dashboard.kpi.tasaOcupacionSubtitulo')}
              icon={TrendingUp}
              color={(utilizacion?.porcentajeOcupacionGlobal ?? 0) >= 50 ? 'success' : 'warning'}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GraficoUtilizacion
              data={utilizacion?.porCategoria ?? []}
              isLoading={isLoading}
            />
            <GraficoIngresos
              data={ingresos?.porPeriodo ?? []}
              moneda={ingresos?.moneda}
              isLoading={isLoading}
            />
          </div>
        </>
      )}
    </div>
  );
}
