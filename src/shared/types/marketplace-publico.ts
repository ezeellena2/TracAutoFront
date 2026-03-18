/** DTOs del marketplace publico (sin autenticacion) */

export interface ConcesionariaPublicaDto {
  id: string;
  nombre: string;
}

export interface VendedorResumenDto {
  id: string;
  nombre: string;
  slug: string | null;
}

export interface ContactoPublicoDto {
  nombre: string;
  telefono: string;
  email: string;
}

/** Publicacion en listado (sin detalle completo) */
export interface PublicacionPublicaDto {
  id: string;
  marca: string;
  modelo: string;
  anio: number | null;
  precio: number | null;
  moneda: string;
  kilometraje: number;
  destacado: boolean;
  fechaPublicacion: string;
  imagenPortadaUrl: string | null;
  vendedor: VendedorResumenDto;
}

/** Publicacion con detalle completo (imagenes, contacto, descripcion) */
export interface PublicacionPublicaDetalleDto {
  id: string;
  marca: string;
  modelo: string;
  anio: number | null;
  precio: number | null;
  moneda: string;
  kilometraje: number;
  descripcion: string | null;
  destacado: boolean;
  fechaPublicacion: string;
  imagenPortadaUrl: string | null;
  imagenesUrls: string[];
  vendedor: VendedorResumenDto;
  contacto: ContactoPublicoDto;
}

/** Favorito del marketplace */
export interface FavoritoMarketplaceDto {
  id: string;
  vehiculoPublicacionId: string;
  marca: string;
  modelo: string;
  anio: number | null;
  precio: number | null;
  moneda: string;
  kilometraje: number;
  descripcion: string | null;
  concesionariaNombre: string;
  fechaAgregado: string;
}

/** Parametros de filtro para busqueda publica de vehiculos */
export interface FiltrosVehiculoPublico {
  numeroPagina?: number;
  tamanoPagina?: number;
  marca?: string;
  modelo?: string;
  concesionariaId?: string;
  anioDesde?: number;
  anioHasta?: number;
  precioDesde?: number;
  precioHasta?: number;
  kilometrajeHasta?: number;
  ordenarPor?: 'precio' | 'anio' | 'kilometraje' | 'fechaPublicacion';
  descendente?: boolean;
}
