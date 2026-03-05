/**
 * Tipos del modulo de alquileres.
 * Los DTOs compartidos con el backend se definen en @/shared/types/api.ts.
 * Este archivo es para tipos exclusivos del frontend (estados de UI, formularios, etc.)
 */

/** Estado del wizard de creacion de reserva */
export type WizardStep = 'cliente' | 'vehiculo' | 'opciones' | 'resumen';

/** Filtros de la tabla de reservas */
export interface FiltrosReservas {
  estado?: string[];
  sucursalId?: string;
  clienteId?: string;
  vehiculoId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  origen?: string;
  busqueda?: string;
}

/** Vista de la pagina de reservas */
export type VistaReservas = 'tabla' | 'calendario';
