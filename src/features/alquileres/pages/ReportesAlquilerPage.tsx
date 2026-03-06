import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { KPICard, Card, CardHeader, Badge, Button, Spinner, ApiErrorBanner } from '@/shared/ui';
import { usePermissions } from '@/hooks';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import { CategoriaAlquiler } from '../types/vehiculoAlquiler';
import { TipoReporte, AgrupacionPeriodo } from '../types/reportes';
import { useReportesAlquiler } from '../hooks/useReportesAlquiler';
import { GraficoIngresos } from '../components/GraficoIngresos';

export function ReportesAlquilerPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();

  const {
    estadisticas,
    ingresos,
    topVehiculos,
    isLoading,
    error,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    sucursalId,
    setSucursalId,
    categoria,
    setCategoria,
    agrupacion,
    setAgrupacion,
    agrupacionOptions,
    sucursalesFiltro,
    exportar,
    isExportando,
  } = useReportesAlquiler();

  const categoriaOptions = useMemo(
    () =>
      Object.values(CategoriaAlquiler)
        .filter((v) => typeof v === 'number')
        .map((v) => ({ value: v as number, label: t(`alquileres.flota.categorias.${v}`) })),
    [t],
  );

  const [tipoExportar, setTipoExportar] = useState<TipoReporte>(TipoReporte.Ingresos);

  const tipoReporteOptions = useMemo(
    () => [
      { value: TipoReporte.Ingresos, label: t('alquileres.reportes.exportar.tipoIngresos') },
      { value: TipoReporte.UtilizacionFlota, label: t('alquileres.reportes.exportar.tipoUtilizacion') },
      { value: TipoReporte.EstadisticasReservas, label: t('alquileres.reportes.exportar.tipoEstadisticas') },
      { value: TipoReporte.TopVehiculos, label: t('alquileres.reportes.exportar.tipoTopVehiculos') },
    ],
    [t],
  );

  const moneda = ingresos?.moneda ?? 'ARS';

  if (!can('alquileres:reportes')) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-text-muted text-lg">{t('common.sinAcceso')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">{t('alquileres.reportes.titulo')}</h1>
        <p className="text-text-muted mt-1">{t('alquileres.reportes.subtitulo')}</p>
      </div>

      {/* Filtros inline */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          {/* Fecha inicio */}
          <div className="space-y-1.5">
            <label htmlFor="reportes-fecha-inicio" className="text-sm font-medium text-text block">
              {t('alquileres.reportes.filtros.fechaInicio')}
            </label>
            <input
              id="reportes-fecha-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />
          </div>

          {/* Fecha fin */}
          <div className="space-y-1.5">
            <label htmlFor="reportes-fecha-fin" className="text-sm font-medium text-text block">
              {t('alquileres.reportes.filtros.fechaFin')}
            </label>
            <input
              id="reportes-fecha-fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />
          </div>

          {/* Sucursal */}
          <div className="space-y-1.5">
            <label htmlFor="reportes-sucursal" className="text-sm font-medium text-text block">
              {t('alquileres.reportes.filtros.sucursal')}
            </label>
            <select
              id="reportes-sucursal"
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm appearance-none min-w-[160px]"
            >
              <option value="">{t('alquileres.reportes.filtros.sucursalPlaceholder')}</option>
              {sucursalesFiltro.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — {s.ciudad}
                </option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <label htmlFor="reportes-categoria" className="text-sm font-medium text-text block">
              {t('alquileres.reportes.filtros.categoria')}
            </label>
            <select
              id="reportes-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm appearance-none min-w-[160px]"
            >
              <option value="">{t('alquileres.reportes.filtros.categoriaPlaceholder')}</option>
              {categoriaOptions.map((opt) => (
                <option key={opt.value} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Agrupación */}
          <div className="space-y-1.5">
            <label htmlFor="reportes-agrupacion" className="text-sm font-medium text-text block">
              {t('alquileres.reportes.filtros.agrupacion')}
            </label>
            <select
              id="reportes-agrupacion"
              value={agrupacion}
              onChange={(e) => setAgrupacion(Number(e.target.value) as AgrupacionPeriodo)}
              className="px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm appearance-none min-w-[140px]"
            >
              {agrupacionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Exportar */}
          <div className="flex items-end gap-2">
            <div className="space-y-1.5">
              <label htmlFor="reportes-tipo-exportar" className="text-sm font-medium text-text block">
                {t('alquileres.reportes.exportar.tipo')}
              </label>
              <select
                id="reportes-tipo-exportar"
                value={tipoExportar}
                onChange={(e) => setTipoExportar(Number(e.target.value) as TipoReporte)}
                className="px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm appearance-none min-w-[160px]"
              >
                {tipoReporteOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => exportar(tipoExportar)}
              disabled={isExportando}
            >
              <Download size={16} className="mr-2" />
              {isExportando
                ? t('alquileres.reportes.exportar.exportando')
                : t('alquileres.reportes.exportar.boton')
              }
            </Button>
          </div>
        </div>
      </Card>

      <ApiErrorBanner error={error} />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          {/* KPI resumen */}
          {estadisticas && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title={t('alquileres.reportes.estadisticas.totalReservas')}
                value={estadisticas.totalReservas}
                color="primary"
              />
              <KPICard
                title={t('alquileres.reportes.estadisticas.tasaCompletadas')}
                value={`${estadisticas.tasaCompletadas.toFixed(1)}%`}
                color="success"
              />
              <KPICard
                title={t('alquileres.reportes.estadisticas.tasaCancelacion')}
                value={`${estadisticas.tasaCancelacion.toFixed(1)}%`}
                color="error"
              />
              <KPICard
                title={t('alquileres.reportes.estadisticas.ingresosTotales')}
                value={formatCurrency(estadisticas.revenueTotalPeriodo, moneda)}
                color="warning"
              />
            </div>
          )}

          {/* Gráfico de ingresos */}
          <GraficoIngresos
            data={ingresos?.porPeriodo ?? []}
            moneda={moneda}
            isLoading={false}
          />

          {/* Tabla: Ingresos por período */}
          {ingresos && ingresos.porPeriodo.length > 0 && (
            <Card>
              <CardHeader title={t('alquileres.reportes.tablas.ingresosPorPeriodo')} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-text-muted">
                        {t('alquileres.reportes.tablas.periodo')}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-text-muted">
                        {t('alquileres.reportes.tablas.ingresos')}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-text-muted">
                        {t('alquileres.reportes.tablas.reservas')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresos.porPeriodo.map((item) => (
                      <tr key={item.periodoLabel} className="border-b border-border/50 hover:bg-background/50">
                        <td className="py-3 px-4 text-text">{item.periodoLabel}</td>
                        <td className="py-3 px-4 text-right text-text font-medium">
                          {formatCurrency(item.ingresos, moneda)}
                        </td>
                        <td className="py-3 px-4 text-right text-text-muted">{item.cantidadReservas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tabla: Ingresos por sucursal */}
          {ingresos && ingresos.porSucursal.length > 0 && (
            <Card>
              <CardHeader title={t('alquileres.reportes.tablas.ingresosPorSucursal')} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-text-muted">
                        {t('alquileres.reportes.tablas.sucursal')}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-text-muted">
                        {t('alquileres.reportes.tablas.ingresos')}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-text-muted">
                        {t('alquileres.reportes.tablas.reservas')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresos.porSucursal.map((item) => (
                      <tr key={item.sucursalId} className="border-b border-border/50 hover:bg-background/50">
                        <td className="py-3 px-4 text-text">{item.sucursalNombre}</td>
                        <td className="py-3 px-4 text-right text-text font-medium">
                          {formatCurrency(item.ingresos, moneda)}
                        </td>
                        <td className="py-3 px-4 text-right text-text-muted">{item.cantidadReservas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tabla: Top vehículos */}
          {topVehiculos && topVehiculos.vehiculos.length > 0 && (
            <Card>
              <CardHeader title={t('alquileres.reportes.tablas.topVehiculos')} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-text-muted">
                        {t('alquileres.reportes.tablas.vehiculo')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-text-muted">
                        {t('alquileres.reportes.tablas.patente')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-text-muted">
                        {t('alquileres.reportes.tablas.categoria')}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-text-muted">
                        {t('alquileres.reportes.tablas.totalAlquileres')}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-text-muted">
                        {t('alquileres.reportes.tablas.revenue')}
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-text-muted">
                        {t('alquileres.reportes.tablas.ocupacion')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVehiculos.vehiculos.map((v) => (
                      <tr key={v.vehiculoAlquilerId} className="border-b border-border/50 hover:bg-background/50">
                        <td className="py-3 px-4 text-text">
                          {[v.marca, v.modelo, v.anio].filter(Boolean).join(' ') || v.patente}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="info">{v.patente}</Badge>
                        </td>
                        <td className="py-3 px-4 text-text-muted">
                          {t(`alquileres.flota.categorias.${v.categoria}`)}
                        </td>
                        <td className="py-3 px-4 text-right text-text">{v.totalAlquileres}</td>
                        <td className="py-3 px-4 text-right text-text font-medium">
                          {formatCurrency(v.revenueTotalGenerado, moneda)}
                        </td>
                        <td className="py-3 px-4 text-right text-text-muted">
                          {v.porcentajeOcupacion.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
