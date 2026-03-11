/**
 * Tipos para el modulo de Sucursales
 * Alineados con los DTOs del backend (SucursalDto, SucursalDetalleDto, HorarioSucursalDto)
 */

// DTO compacto para listas (SucursalDto del backend)
export interface SucursalDto {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal?: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  email?: string;
  permiteOneWay: boolean;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// DTO detallado con horarios (SucursalDetalleDto del backend)
export interface SucursalDetalleDto extends SucursalDto {
  notas?: string;
  horarios: HorarioSucursalDto[];
}

// Horario por dia de la semana
export interface HorarioSucursalDto {
  diaSemana: number;       // 0=Domingo...6=Sabado (DayOfWeek de .NET)
  horaApertura: string;    // "HH:mm:ss" (TimeOnly serializado)
  horaCierre: string;
  cerrado: boolean;
}

// Request para crear sucursal (alineado con CreateSucursalCommand)
export interface CreateSucursalRequest {
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal?: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  email?: string;
  permiteOneWay: boolean;
  notas?: string;
  horarios: HorarioSucursalDto[];
}

// Request para actualizar sucursal (alineado con UpdateSucursalCommand)
export interface UpdateSucursalRequest extends CreateSucursalRequest {
  id: string;
}
