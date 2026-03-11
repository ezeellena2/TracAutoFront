import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/hooks';
import { formatDate } from '@/shared/utils/dateFormatter';
import { CalendarCheck, Eye, Check, X, UserX, TableProperties, Calendar, Plus, Download } from 'lucide-react';
import { downloadBlob } from '@/shared/utils/fileUtils';
import { exportarReservasCSV } from '../utils/formatters';
import {
  Card,
  Badge,
  Table,
  KPICard,
  PaginationControls,
  AdvancedFilterBar,
  ConfirmationModal,
  EstadoVacio,
  EstadoError,
  ActionMenu,
  Button,
} from '@/shared/ui';
import type { FilterConfig } from '@/shared/ui/AdvancedFilter/types';
import { usePermissions } from '@/hooks';
import { useReservasPage } from '../hooks/useReservasPage';
import { CalendarioReservas } from '../components/CalendarioReservas';
import { CancelarReservaModal } from '../components/CancelarReservaModal';
import { ModalCrearReserva } from '../components/wizard/ModalCrearReserva';
import { EstadoReserva, OrigenReserva } from '../types/reserva';
import type { ReservaAlquilerResumenDto, ReservaCalendarioDto } from '../types/reserva';

// Mapeo estado → variante de Badge
const ESTADO_BADGE_VARIANT: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [EstadoReserva.Tentativa]: 'warning',
  [EstadoReserva.Confirmada]: 'info',
  [EstadoReserva.EnCurso]: 'success',
  [EstadoReserva.Completada]: 'default',
  [EstadoReserva.Cancelada]: 'error',
  [EstadoReserva.NoShow]: 'error',
};

export function ReservasPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const localization = useLocalization();
  const culture = localization.culture;
  const timeZoneId = localization.timeZoneId;

  const {
    data,
    items,
    isLoading,
    error,
    loadData,
    setNumeroPagina,
    setTamanoPagina,
    filters,
    setFilter,
    clearFilters,
    sucursales,
    vista,
    setVista,
    calendarioData,
    isCalendarioLoading,
    calMes,
    calAnio,
    handlePrevMonth,
    handleNextMonth,
    reservaSeleccionada,
    isConfirmOpen,
    setIsConfirmOpen,
    isCancelOpen,
    setIsCancelOpen,
    isNoShowOpen,
    setIsNoShowOpen,
    openConfirm,
    openCancel,
    openNoShow,
    handleConfirm,
    handleCancel,
    handleNoShow,
    isConfirming,
    isCancelling,
    isMarkingNoShow,
  } = useReservasPage();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isCrearOpen, setIsCrearOpen] = useState(false);

  // Opciones de filtros
  const estadoOptions = useMemo(() =>
    Object.values(EstadoReserva)
      .filter(v => typeof v === 'number')
      .map(v => ({ value: v as number, label: t(`alquileres.reservas.estados.${v}`) })),
    [t]
  );

  const origenOptions = useMemo(() =>
    Object.values(OrigenReserva)
      .filter(v => typeof v === 'number')
      .map(v => ({ value: v as number, label: t(`alquileres.reservas.origenes.${v}`) })),
    [t]
  );

  const sucursalOptions = useMemo(() =>
    sucursales.map(s => ({ value: s.id, label: `${s.nombre} — ${s.ciudad}` })),
    [sucursales]
  );

  // Config de filtros
  const filtersConfig: FilterConfig[] = useMemo(() => [
    {
      key: 'buscar',
      label: t('alquileres.reservas.filtros.buscar'),
      type: 'text',
      placeholder: t('alquileres.reservas.filtros.buscarPlaceholder'),
    },
    {
      key: 'estado',
      label: t('alquileres.reservas.filtros.estado'),
      type: 'select',
      options: estadoOptions,
      placeholder: t('alquileres.reservas.filtros.estadoPlaceholder'),
    },
    {
      key: 'sucursalId',
      label: t('alquileres.reservas.filtros.sucursal'),
      type: 'select',
      options: sucursalOptions,
      placeholder: t('alquileres.reservas.filtros.sucursalPlaceholder'),
    },
    {
      key: 'origenReserva',
      label: t('alquileres.reservas.filtros.origen'),
      type: 'select',
      options: origenOptions,
      placeholder: t('alquileres.reservas.filtros.origenPlaceholder'),
    },
    {
      key: 'fechaDesde',
      label: t('alquileres.reservas.filtros.fechaDesde'),
      type: 'date',
    },
    {
      key: 'fechaHasta',
      label: t('alquileres.reservas.filtros.fechaHasta'),
      type: 'date',
    },
  ], [t, estadoOptions, origenOptions, sucursalOptions]);

  // Columnas de tabla
  const columns = useMemo(() => [
    {
      key: 'numeroReserva',
      header: t('alquileres.reservas.tabla.numero'),
      render: (item: ReservaAlquilerResumenDto) => (
        <span className="font-medium text-text font-mono">{item.numeroReserva}</span>
      ),
    },
    {
      key: 'cliente',
      header: t('alquileres.reservas.tabla.cliente'),
      render: (item: ReservaAlquilerResumenDto) => (
        <span className="text-text text-sm">{item.clienteNombreCompleto}</span>
      ),
    },
    {
      key: 'vehiculo',
      header: t('alquileres.reservas.tabla.vehiculo'),
      render: (item: ReservaAlquilerResumenDto) => (
        <span className="text-text text-sm">
          {item.vehiculoDescripcion ?? (
            <span className="text-text-muted">{t('alquileres.reservas.tabla.sinVehiculo')}</span>
          )}
        </span>
      ),
    },
    {
      key: 'fechas',
      header: t('alquileres.reservas.tabla.fechas'),
      render: (item: ReservaAlquilerResumenDto) => (
        <div className="text-sm">
          <div className="text-text">{formatDate(item.fechaHoraRecogida, culture, timeZoneId)}</div>
          <div className="text-text-muted">{formatDate(item.fechaHoraDevolucion, culture, timeZoneId)}</div>
        </div>
      ),
      mobileHidden: true,
    },
    {
      key: 'sucursal',
      header: t('alquileres.reservas.tabla.sucursal'),
      render: (item: ReservaAlquilerResumenDto) => (
        <span className="text-text text-sm">{item.sucursalRecogida}</span>
      ),
      mobileHidden: true,
    },
    {
      key: 'estado',
      header: t('alquileres.reservas.tabla.estado'),
      render: (item: ReservaAlquilerResumenDto) => (
        <Badge variant={ESTADO_BADGE_VARIANT[item.estado] ?? 'default'}>
          {t(`alquileres.reservas.estados.${item.estado}`)}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: t('alquileres.reservas.tabla.total'),
      render: (item: ReservaAlquilerResumenDto) => (
        <span className="text-text font-medium">
          ${item.precioTotal.toLocaleString()} {item.moneda}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: t('alquileres.reservas.tabla.acciones'),
      render: (item: ReservaAlquilerResumenDto) => {
        const canEdit = can('alquileres:editar');
        return (
          <ActionMenu
            isOpen={openMenuId === item.id}
            onToggle={() => setOpenMenuId(prev => prev === item.id ? null : item.id)}
            onClose={() => setOpenMenuId(null)}
          >
            <button
              onClick={() => { setOpenMenuId(null); navigate(`/alquileres/reservas/${item.id}`); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-border transition-colors"
            >
              <Eye size={14} />
              {t('alquileres.reservas.acciones.verDetalle')}
            </button>
            {canEdit && item.estado === EstadoReserva.Tentativa && (
              <button
                onClick={() => { setOpenMenuId(null); openConfirm(item); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-border transition-colors"
              >
                <Check size={14} />
                {t('alquileres.reservas.acciones.confirmar')}
              </button>
            )}
            {canEdit && (item.estado === EstadoReserva.Tentativa || item.estado === EstadoReserva.Confirmada) && (
              <button
                onClick={() => { setOpenMenuId(null); openCancel(item); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-border transition-colors"
              >
                <X size={14} />
                {t('alquileres.reservas.acciones.cancelar')}
              </button>
            )}
            {canEdit && item.estado === EstadoReserva.Confirmada && (
              <button
                onClick={() => { setOpenMenuId(null); openNoShow(item); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-border transition-colors"
              >
                <UserX size={14} />
                {t('alquileres.reservas.acciones.noShow')}
              </button>
            )}
          </ActionMenu>
        );
      },
    },
  ], [t, can, openMenuId, navigate, openConfirm, openCancel, openNoShow]);

  // Click en calendario → navegar a detalle
  const handleCalendarioReservaClick = (reserva: ReservaCalendarioDto) => {
    navigate(`/alquileres/reservas/${reserva.id}`);
  };

  // Estado de error
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('alquileres.reservas.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.reservas.subtitulo')}</p>
        </div>
        <Card>
          <EstadoError mensaje={error} onReintentar={() => loadData()} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{t('alquileres.reservas.titulo')}</h1>
          <p className="text-text-muted mt-1">{t('alquileres.reservas.subtitulo')}</p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const blob = exportarReservasCSV(items, t);
                downloadBlob(blob, `reservas-${new Date().toISOString().split('T')[0]}.csv`);
              }}
            >
              <Download size={16} className="mr-1.5" />
              {t('alquileres.reservas.exportar')}
            </Button>
          )}
          {can('alquileres:crear') && (
            <Button onClick={() => setIsCrearOpen(true)}>
              <Plus size={16} className="mr-1.5" />
              {t('alquileres.reservas.crearReserva')}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Card */}
      <KPICard
        title={t('alquileres.reservas.totalReservas')}
        value={data?.totalRegistros ?? 0}
        icon={CalendarCheck}
        color="primary"
      />

      {/* Vista toggle */}
      <div className="flex items-center gap-2">
        <div className="flex bg-background border border-border rounded-lg p-1" role="tablist">
          <button
            role="tab"
            aria-selected={vista === 'tabla'}
            onClick={() => setVista('tabla')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              vista === 'tabla' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            <TableProperties size={14} />
            {t('alquileres.reservas.vistaTabla')}
          </button>
          <button
            role="tab"
            aria-selected={vista === 'calendario'}
            onClick={() => setVista('calendario')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              vista === 'calendario' ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text'
            }`}
          >
            <Calendar size={14} />
            {t('alquileres.reservas.vistaCalendario')}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <AdvancedFilterBar
        config={filtersConfig}
        filters={filters}
        onFilterChange={(key, value) => setFilter(key, value, 'eq')}
        onClearFilters={clearFilters}
      />

      {/* Contenido según vista */}
      {vista === 'tabla' ? (
        <Card padding="none">
          {items.length === 0 && !isLoading ? (
            <EstadoVacio
              titulo={t('alquileres.reservas.titulo')}
              descripcion={Object.keys(filters).length > 0
                ? t('filters.noResults')
                : t('common.noData')
              }
              icono={<CalendarCheck className="w-16 h-16" />}
            />
          ) : (
            <>
              <Table
                columns={columns}
                data={items}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
              />
              {data && data.totalRegistros > 0 && (
                <PaginationControls
                  paginaActual={data.paginaActual}
                  totalPaginas={data.totalPaginas}
                  tamanoPagina={data.tamanoPagina}
                  totalRegistros={data.totalRegistros}
                  onPageChange={setNumeroPagina}
                  onPageSizeChange={setTamanoPagina}
                  disabled={isLoading}
                />
              )}
            </>
          )}
        </Card>
      ) : (
        <Card>
          <CalendarioReservas
            reservas={calendarioData}
            isLoading={isCalendarioLoading}
            mes={calMes}
            anio={calAnio}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onReservaClick={handleCalendarioReservaClick}
          />
        </Card>
      )}

      {/* Modal: Confirmar reserva */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        title={t('alquileres.reservas.confirmar.titulo')}
        description={t('alquileres.reservas.confirmar.mensaje', { numero: reservaSeleccionada?.numeroReserva })}
        confirmText={t('alquileres.reservas.acciones.confirmar')}
        cancelText={t('common.cancel')}
        variant="info"
        isLoading={isConfirming}
      />

      {/* Modal: Cancelar reserva */}
      <CancelarReservaModal
        isOpen={isCancelOpen}
        reserva={reservaSeleccionada}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
      />

      {/* Modal: No Show */}
      <ConfirmationModal
        isOpen={isNoShowOpen}
        onClose={() => setIsNoShowOpen(false)}
        onConfirm={handleNoShow}
        title={t('alquileres.reservas.noShow.titulo')}
        description={t('alquileres.reservas.noShow.mensaje', { numero: reservaSeleccionada?.numeroReserva })}
        confirmText={t('alquileres.reservas.acciones.noShow')}
        cancelText={t('common.cancel')}
        variant="danger"
        isLoading={isMarkingNoShow}
      />

      {/* Modal: Crear Reserva */}
      <ModalCrearReserva
        isOpen={isCrearOpen}
        onClose={() => setIsCrearOpen(false)}
      />
    </div>
  );
}
