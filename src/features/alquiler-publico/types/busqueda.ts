/**
 * Tipos públicos para búsqueda de alquiler B2C
 * Alineados con DTOs del backend (AlquilerPublicoController)
 */

import type { HorarioSucursalDto } from '@/features/alquileres/types/sucursal';

// SucursalPublicaDto del backend
export interface SucursalPublicaDto {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  latitud: number | null;
  longitud: number | null;
  telefono: string | null;
  permiteOneWay: boolean;
  horarios: HorarioSucursalDto[];
  organizacionNombre: string;
}

// CategoriaPublicaDto del backend
export interface CategoriaPublicaDto {
  categoriaAlquiler: number;
  nombre: string;
  vehiculosDisponibles: number;
  precioDesde: number;
  precioHasta: number;
  imagenUrl?: string | null;
}

// VehiculoDisponibleDto del backend
export interface VehiculoDisponibleDto {
  id: string;
  vehiculoId: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  categoriaAlquiler: number;
  precioBaseDiario: number;
  sucursalNombre: string;
  precioIndicativo: number;
  transmision: number | null;
  cantidadPasajeros: number | null;
  cantidadPuertas: number | null;
  imagenPrincipalUrl: string | null;
}

// Parámetros de búsqueda para navegación a resultados
export interface BusquedaParams {
  sucursalRecogidaId: string;
  fechaHoraRecogida: string;
  fechaHoraDevolucion: string;
  sucursalDevolucionId?: string;
  categoriaAlquiler?: number;
}
