// Enums alineados con backend (valores numéricos)

export enum CategoriaAlquiler {
  Economico = 1,
  Compacto = 2,
  Intermedio = 3,
  Estandar = 4,
  FullSize = 5,
  SUV = 6,
  Pickup = 7,
  Van = 8,
  Lujo = 9,
  Deportivo = 10,
  Electrico = 11,
}

export enum EstadoVehiculoAlquiler {
  Disponible = 1,
  Reservado = 2,
  EnUso = 3,
  EnMantenimiento = 4,
  FueraDeServicio = 5,
  EnTransito = 6,
}

export enum PoliticaCombustible {
  FullFull = 1,
  PrepaidFuel = 2,
  FreeUpToQuarter = 3,
}

// --- DTOs ---

export interface VehiculoAlquilerDto {
  id: string;
  vehiculoId: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  categoriaAlquiler: CategoriaAlquiler;
  precioBaseDiario: number;
  estado: EstadoVehiculoAlquiler;
  sucursalPorDefectoId: string;
  sucursalPorDefectoNombre: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface SucursalVehiculoDto {
  sucursalId: string;
  nombre: string;
  ciudad: string;
}

export interface VehiculoAlquilerDetalleDto extends VehiculoAlquilerDto {
  depositoMinimo: number;
  kilometrajeLimiteDiario: number | null;
  precioPorKmExcedente: number;
  politicaCombustible: PoliticaCombustible;
  edadMinimaConductor: number;
  licenciaRequerida: string;
  sucursales: SucursalVehiculoDto[];
}

export interface DisponibilidadDiaDto {
  fecha: string;
  ocupado: boolean;
}

// --- Requests ---

export interface AddVehiculoAlquilerRequest {
  vehiculoId: string;
  categoriaAlquiler: CategoriaAlquiler;
  precioBaseDiario: number;
  depositoMinimo: number;
  kilometrajeLimiteDiario: number | null;
  precioPorKmExcedente: number;
  politicaCombustible: PoliticaCombustible;
  edadMinimaConductor: number;
  licenciaRequerida: string;
  sucursalPorDefectoId: string;
  sucursalIds: string[];
}

export interface UpdateVehiculoAlquilerRequest {
  id: string;
  categoriaAlquiler: CategoriaAlquiler;
  precioBaseDiario: number;
  depositoMinimo: number;
  kilometrajeLimiteDiario: number | null;
  precioPorKmExcedente: number;
  politicaCombustible: PoliticaCombustible;
  edadMinimaConductor: number;
  licenciaRequerida: string;
  sucursalPorDefectoId: string;
  sucursalIds: string[];
}

export interface ChangeEstadoRequest {
  id: string;
  nuevoEstado: EstadoVehiculoAlquiler;
}
