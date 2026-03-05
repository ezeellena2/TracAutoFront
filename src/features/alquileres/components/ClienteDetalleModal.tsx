import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, Edit, ExternalLink } from 'lucide-react';
import { Modal, Badge, Table, Button, ApiErrorBanner, Spinner } from '@/shared/ui';
import { usePermissions, useErrorHandler } from '@/hooks';
import { clientesAlquilerApi } from '@/services/endpoints';
import { formatPrecio } from '../utils/formatters';
import { EstadoReserva } from '../types/reserva';
import type { ReservaResumenClienteDto } from '../types/cliente';

interface ClienteDetalleModalProps {
  isOpen: boolean;
  clienteId: string | null;
  onClose: () => void;
  onEdit?: () => void;
}

const ESTADO_BADGE_VARIANT: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [EstadoReserva.Tentativa]: 'warning',
  [EstadoReserva.Confirmada]: 'info',
  [EstadoReserva.EnCurso]: 'success',
  [EstadoReserva.Completada]: 'default',
  [EstadoReserva.Cancelada]: 'error',
  [EstadoReserva.NoShow]: 'error',
};

export function ClienteDetalleModal({ isOpen, clienteId, onClose, onEdit }: ClienteDetalleModalProps) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { handleApiError } = useErrorHandler();
  const navigate = useNavigate();

  const {
    data: detalle,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['alquiler-cliente-detalle', clienteId],
    queryFn: () => clientesAlquilerApi.getById(clienteId!),
    enabled: isOpen && !!clienteId,
  });

  const apiError = queryError ? handleApiError(queryError, { showToast: false }) : null;

  const handleClose = () => {
    onClose();
  };

  const handleVerReserva = (reservaId: string) => {
    handleClose();
    navigate(`/alquileres/reservas/${reservaId}`);
  };

  const sin = t('alquileres.clientes.detalleModal.sinDato');

  const reservaColumns = useMemo(() => [
    {
      key: 'numeroReserva',
      header: '#',
      render: (r: ReservaResumenClienteDto) => (
        <span className="font-medium text-text">{r.numeroReserva}</span>
      ),
    },
    {
      key: 'estado',
      header: t('alquileres.reservas.tabla.estado'),
      render: (r: ReservaResumenClienteDto) => (
        <Badge variant={ESTADO_BADGE_VARIANT[r.estado] ?? 'default'}>
          {t(`alquileres.reservas.estados.${r.estado}`)}
        </Badge>
      ),
    },
    {
      key: 'categoria',
      header: t('alquileres.flota.tabla.categoria'),
      render: (r: ReservaResumenClienteDto) => (
        <span className="text-text">{t(`alquileres.flota.categorias.${r.categoriaAlquiler}`)}</span>
      ),
    },
    {
      key: 'fechas',
      header: t('alquileres.reservas.tabla.fechas'),
      render: (r: ReservaResumenClienteDto) => (
        <div className="text-sm">
          <div className="text-text">{r.fechaHoraRecogida.split('T')[0]}</div>
          <div className="text-text-muted">{r.fechaHoraDevolucion.split('T')[0]}</div>
        </div>
      ),
    },
    {
      key: 'precioTotal',
      header: t('alquileres.reservas.tabla.total'),
      render: (r: ReservaResumenClienteDto) => (
        <span className="text-text font-medium">{formatPrecio(r.precioTotal, r.moneda)}</span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      render: (r: ReservaResumenClienteDto) => (
        <button
          onClick={() => handleVerReserva(r.id)}
          className="text-primary hover:text-primary/80 transition-colors"
          title={t('alquileres.clientes.detalleModal.verReserva')}
        >
          <ExternalLink size={16} />
        </button>
      ),
    },
  ], [t]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <div className="p-6 w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">{t('alquileres.clientes.detalle')}</h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {!isLoading && !detalle && apiError && (
          <ApiErrorBanner error={apiError} jiraLabel="Error detalle cliente" onReportClick={handleClose} />
        )}

        {!isLoading && detalle && (
          <div className="space-y-6">
            {/* Datos del cliente */}
            <div>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                {t('alquileres.clientes.detalleModal.datosCliente')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                <Campo label={t('alquileres.clientes.form.nombre')} valor={`${detalle.nombre} ${detalle.apellido}`} />
                <Campo label={t('alquileres.clientes.form.email')} valor={detalle.email} />
                <Campo label={t('alquileres.clientes.form.telefono')} valor={detalle.telefono ?? sin} />
                <Campo
                  label={t('alquileres.clientes.form.documentoSeccion')}
                  valor={`${t(`alquileres.clientes.tiposDocumento.${detalle.tipoDocumento}`)} ${detalle.numeroDocumento}`}
                />
                <Campo
                  label={t('alquileres.clientes.form.fechaNacimiento')}
                  valor={detalle.fechaNacimiento ?? sin}
                />
                <Campo label={t('alquileres.clientes.form.direccion')} valor={detalle.direccion ?? sin} />
                <Campo
                  label={t('alquileres.clientes.form.ciudad')}
                  valor={[detalle.ciudad, detalle.provincia].filter(Boolean).join(', ') || sin}
                />
                <Campo label={t('alquileres.clientes.form.codigoPostal')} valor={detalle.codigoPostal ?? sin} />
                <Campo
                  label={t('alquileres.clientes.form.licenciaConducir')}
                  valor={detalle.numeroLicenciaConducir ?? sin}
                />
                <Campo
                  label={t('alquileres.clientes.form.vencimientoLicencia')}
                  valor={detalle.vencimientoLicencia ?? sin}
                />
                {detalle.notas && (
                  <div className="md:col-span-2">
                    <Campo label={t('alquileres.clientes.form.notas')} valor={detalle.notas} />
                  </div>
                )}
              </div>
            </div>

            {/* Historial de reservas */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                  {t('alquileres.clientes.detalleModal.historialReservas')}
                </h3>
                <Badge variant="default">{detalle.totalReservas}</Badge>
              </div>

              {detalle.ultimasReservas.length === 0 ? (
                <p className="text-sm text-text-muted py-4">
                  {t('alquileres.clientes.detalleModal.sinReservas')}
                </p>
              ) : (
                <>
                  <Table
                    columns={reservaColumns}
                    data={detalle.ultimasReservas}
                    keyExtractor={(r) => r.id}
                  />
                  {detalle.totalReservas > detalle.ultimasReservas.length && (
                    <p className="text-xs text-text-muted mt-2 text-center">
                      {t('alquileres.clientes.detalleModal.mostrando', {
                        mostradas: detalle.ultimasReservas.length,
                        total: detalle.totalReservas,
                      })}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-2">
              {onEdit && can('alquileres:editar') && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { handleClose(); onEdit(); }}
                  className="flex-1"
                >
                  <Edit size={16} className="mr-2" />
                  {t('common.edit')}
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="text-sm text-text mt-0.5">{valor}</dd>
    </div>
  );
}
