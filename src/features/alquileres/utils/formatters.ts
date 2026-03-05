import i18n from '@/shared/i18n/config';
import type { TFunction } from 'i18next';
import type { ReservaAlquilerResumenDto } from '../types/reserva';

/**
 * Formatea un monto como precio con moneda, usando el locale activo de i18n.
 */
export function formatPrecio(monto: number, moneda: string = 'ARS'): string {
  return new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: moneda,
  }).format(monto);
}

export function exportarReservasCSV(items: ReservaAlquilerResumenDto[], t: TFunction): Blob {
  const headers = [
    t('alquileres.reservas.tabla.codigo'),
    t('alquileres.reservas.tabla.cliente'),
    t('alquileres.reservas.tabla.vehiculo'),
    t('alquileres.reservas.tabla.sucursal'),
    t('alquileres.reservas.tabla.fechas') + ' - ' + t('common.start'),
    t('alquileres.reservas.tabla.fechas') + ' - ' + t('common.end'),
    t('alquileres.reservas.tabla.estado'),
    t('alquileres.reservas.tabla.total'),
    t('alquileres.reservas.tabla.moneda'),
  ];

  const escapeCSV = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = items.map(r => [
    r.numeroReserva,
    r.clienteNombreCompleto,
    r.vehiculoDescripcion ?? '',
    r.sucursalRecogida,
    r.fechaHoraRecogida,
    r.fechaHoraDevolucion,
    String(r.estado),
    String(r.precioTotal),
    r.moneda,
  ].map(escapeCSV).join(','));

  const bom = '\uFEFF';
  const csv = bom + [headers.map(escapeCSV).join(','), ...rows].join('\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}
