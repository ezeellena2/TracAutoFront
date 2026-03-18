import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Gauge,
  Thermometer,
  Battery,
  Fuel,
  Clock,
  Car,
  Zap,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  KPICard,
  Card,
  CardHeader,
  Badge,
  Button,
  Spinner,
  EstadoError,
  EstadoVacio,
} from '@/shared/ui';
import { useOBDDashboard, useOBDLatest, useVehiculosTelemetria } from '../hooks/useOBDData';
import { TelemetryGauge } from '../components/TelemetryGauge';
import type { VehiculoTelemetriaKpiDto } from '../types';

export function OBDDashboardPage() {
  const { t } = useTranslation();
  const { kpis, isLoading, error, refetch } = useOBDDashboard();
  const {
    vehiculos,
    totalPaginas,
    paginaActual,
    isLoading: isLoadingVehiculos,
    setPage,
  } = useVehiculosTelemetria();

  const [selectedVehicle, setSelectedVehicle] = useState<VehiculoTelemetriaKpiDto | null>(null);
  const { snapshot } = useOBDLatest(selectedVehicle?.vehiculoId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('obdDiagnostics.title')}</h1>
          <p className="text-text-muted mt-1">{t('obdDiagnostics.subtitle')}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg hover:bg-surface transition-colors text-text-muted hover:text-text"
          title={t('common.refresh')}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <EstadoError mensaje={t('obdDiagnostics.errorLoading')} onReintentar={() => refetch()} />
      ) : (
        <>
          {/* Fleet KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title={t('obdDiagnostics.kpi.vehiclesWithTelemetry')}
              value={`${kpis?.vehiculosConTelemetria ?? 0} / ${kpis?.vehiculosTotales ?? 0}`}
              icon={Car}
              color="primary"
            />
            <KPICard
              title={t('obdDiagnostics.kpi.obd2Readings')}
              value={kpis?.lecturasObd2 ?? 0}
              icon={Activity}
              color="success"
            />
            <KPICard
              title={t('obdDiagnostics.kpi.totalDistanceKm')}
              value={`${(kpis?.distanciaTotalKm ?? 0).toFixed(0)} km`}
              icon={Zap}
              color="warning"
            />
            <KPICard
              title={t('obdDiagnostics.kpi.alertsGenerated')}
              value={kpis?.alertasGeneradas ?? 0}
              icon={AlertTriangle}
              color={kpis?.alertasGeneradas ? 'error' : 'success'}
            />
          </div>

          {/* Selected vehicle OBD2 detail */}
          {selectedVehicle && (
            <Card>
              <CardHeader
                title={t('obdDiagnostics.vehicleDetail', { patente: selectedVehicle.patente })}
                subtitle={t('obdDiagnostics.liveReadings')}
                action={
                  <Button variant="ghost" size="sm" onClick={() => setSelectedVehicle(null)}>
                    {t('common.close')}
                  </Button>
                }
              />
              {snapshot ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <TelemetryGauge
                    label={t('obdDiagnostics.gauges.rpm')}
                    value={snapshot.rpm}
                    unit="RPM"
                    icon={Gauge}
                    min={0}
                    max={8000}
                    warningThreshold={5000}
                    criticalThreshold={6500}
                  />
                  <TelemetryGauge
                    label={t('obdDiagnostics.gauges.engineTemp')}
                    value={snapshot.temperaturaMotorCelsius}
                    unit="°C"
                    icon={Thermometer}
                    min={0}
                    max={150}
                    warningThreshold={95}
                    criticalThreshold={110}
                  />
                  <TelemetryGauge
                    label={t('obdDiagnostics.gauges.battery')}
                    value={snapshot.voltajeBateria}
                    unit="V"
                    icon={Battery}
                    min={10}
                    max={15}
                    warningThreshold={11.5}
                    criticalThreshold={11}
                  />
                  <TelemetryGauge
                    label={t('obdDiagnostics.gauges.fuel')}
                    value={snapshot.nivelCombustiblePorcentaje}
                    unit="%"
                    icon={Fuel}
                    min={0}
                    max={100}
                    warningThreshold={80}
                    criticalThreshold={90}
                  />
                  <TelemetryGauge
                    label={t('obdDiagnostics.gauges.engineHours')}
                    value={snapshot.horasMotor}
                    unit="h"
                    icon={Clock}
                    min={0}
                    max={10000}
                  />
                  <div className="bg-surface rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={16} className="text-text-muted" />
                      <span className="text-sm text-text-muted">{t('obdDiagnostics.gauges.ignition')}</span>
                    </div>
                    <Badge
                      variant={snapshot.ignicionEncendida ? 'success' : 'default'}
                      size="md"
                    >
                      {snapshot.ignicionEncendida
                        ? t('obdDiagnostics.ignitionOn')
                        : t('obdDiagnostics.ignitionOff')}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted py-4">{t('obdDiagnostics.noData')}</p>
              )}
            </Card>
          )}

          {/* Vehicle telemetry table */}
          <Card>
            <CardHeader
              title={t('obdDiagnostics.vehicleList')}
              subtitle={t('obdDiagnostics.vehicleListSubtitle')}
            />
            {isLoadingVehiculos ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : vehiculos.length === 0 ? (
              <EstadoVacio
                titulo={t('obdDiagnostics.noVehicles')}
                descripcion={t('obdDiagnostics.noVehiclesDesc')}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 font-medium text-text-muted">{t('obdDiagnostics.table.patente')}</th>
                        <th className="pb-3 font-medium text-text-muted">{t('obdDiagnostics.table.distance')}</th>
                        <th className="pb-3 font-medium text-text-muted">{t('obdDiagnostics.table.avgSpeed')}</th>
                        <th className="pb-3 font-medium text-text-muted">{t('obdDiagnostics.table.maxSpeed')}</th>
                        <th className="pb-3 font-medium text-text-muted">{t('obdDiagnostics.table.obd2Readings')}</th>
                        <th className="pb-3 font-medium text-text-muted">{t('obdDiagnostics.table.alerts')}</th>
                        <th className="pb-3 font-medium text-text-muted" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {vehiculos.map((v) => (
                        <tr
                          key={v.vehiculoId}
                          className={`hover:bg-background transition-colors cursor-pointer ${
                            selectedVehicle?.vehiculoId === v.vehiculoId ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => setSelectedVehicle(v)}
                        >
                          <td className="py-3 font-medium text-text">{v.patente}</td>
                          <td className="py-3 text-text-muted">{v.distanciaRecorridaKm.toFixed(1)} km</td>
                          <td className="py-3 text-text-muted">{v.velocidadPromedioKmh.toFixed(0)} km/h</td>
                          <td className="py-3 text-text-muted">{v.velocidadMaximaKmh.toFixed(0)} km/h</td>
                          <td className="py-3">
                            <Badge variant={v.lecturasObd2 > 0 ? 'success' : 'default'} size="sm">
                              {v.lecturasObd2}
                            </Badge>
                          </td>
                          <td className="py-3">
                            {v.alertasGeneradas > 0 ? (
                              <Badge variant="error" size="sm">{v.alertasGeneradas}</Badge>
                            ) : (
                              <Badge variant="success" size="sm">0</Badge>
                            )}
                          </td>
                          <td className="py-3">
                            <Button variant="ghost" size="sm">
                              {t('obdDiagnostics.viewDetail')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPaginas > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-border mt-4">
                    <Button variant="ghost" size="sm" onClick={() => setPage(paginaActual - 1)} disabled={paginaActual <= 1}>
                      <ChevronLeft size={16} />
                    </Button>
                    <span className="text-sm text-text-muted">
                      {t('common.pageOf', { current: paginaActual, total: totalPaginas })}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setPage(paginaActual + 1)} disabled={paginaActual >= totalPaginas}>
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
