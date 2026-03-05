/**
 * Definiciones de placeholders de contratos, datos de ejemplo y utilidad de reemplazo.
 * Los placeholders están alineados con el backend (GenerarContratoHandler).
 */

export interface PlaceholderDef {
  key: string;
  labelKey: string;
}

export interface PlaceholderGroup {
  grupo: string;
  labelKey: string;
  placeholders: PlaceholderDef[];
}

export const PLACEHOLDER_GROUPS: PlaceholderGroup[] = [
  {
    grupo: 'cliente',
    labelKey: 'alquileres.contratos.placeholders.categorias.cliente',
    placeholders: [
      { key: '{{cliente.nombreCompleto}}', labelKey: 'alquileres.contratos.placeholders.cliente.nombreCompleto' },
      { key: '{{cliente.email}}', labelKey: 'alquileres.contratos.placeholders.cliente.email' },
      { key: '{{cliente.telefono}}', labelKey: 'alquileres.contratos.placeholders.cliente.telefono' },
      { key: '{{cliente.documento}}', labelKey: 'alquileres.contratos.placeholders.cliente.documento' },
      { key: '{{cliente.direccion}}', labelKey: 'alquileres.contratos.placeholders.cliente.direccion' },
    ],
  },
  {
    grupo: 'vehiculo',
    labelKey: 'alquileres.contratos.placeholders.categorias.vehiculo',
    placeholders: [
      { key: '{{vehiculo.marca}}', labelKey: 'alquileres.contratos.placeholders.vehiculo.marca' },
      { key: '{{vehiculo.modelo}}', labelKey: 'alquileres.contratos.placeholders.vehiculo.modelo' },
      { key: '{{vehiculo.patente}}', labelKey: 'alquileres.contratos.placeholders.vehiculo.patente' },
      { key: '{{vehiculo.anio}}', labelKey: 'alquileres.contratos.placeholders.vehiculo.anio' },
      { key: '{{vehiculo.categoria}}', labelKey: 'alquileres.contratos.placeholders.vehiculo.categoria' },
    ],
  },
  {
    grupo: 'reserva',
    labelKey: 'alquileres.contratos.placeholders.categorias.reserva',
    placeholders: [
      { key: '{{reserva.numero}}', labelKey: 'alquileres.contratos.placeholders.reserva.numero' },
      { key: '{{reserva.fechaRecogida}}', labelKey: 'alquileres.contratos.placeholders.reserva.fechaRecogida' },
      { key: '{{reserva.fechaDevolucion}}', labelKey: 'alquileres.contratos.placeholders.reserva.fechaDevolucion' },
      { key: '{{reserva.precioTotal}}', labelKey: 'alquileres.contratos.placeholders.reserva.precioTotal' },
      { key: '{{reserva.deposito}}', labelKey: 'alquileres.contratos.placeholders.reserva.deposito' },
      { key: '{{reserva.moneda}}', labelKey: 'alquileres.contratos.placeholders.reserva.moneda' },
    ],
  },
  {
    grupo: 'organizacion',
    labelKey: 'alquileres.contratos.placeholders.categorias.organizacion',
    placeholders: [
      { key: '{{organizacion.nombre}}', labelKey: 'alquileres.contratos.placeholders.organizacion.nombre' },
      { key: '{{organizacion.cuit}}', labelKey: 'alquileres.contratos.placeholders.organizacion.cuit' },
    ],
  },
  {
    grupo: 'sucursal',
    labelKey: 'alquileres.contratos.placeholders.categorias.sucursal',
    placeholders: [
      { key: '{{sucursal.recogida.nombre}}', labelKey: 'alquileres.contratos.placeholders.sucursal.recogidaNombre' },
      { key: '{{sucursal.recogida.direccion}}', labelKey: 'alquileres.contratos.placeholders.sucursal.recogidaDireccion' },
      { key: '{{sucursal.devolucion.nombre}}', labelKey: 'alquileres.contratos.placeholders.sucursal.devolucionNombre' },
      { key: '{{sucursal.devolucion.direccion}}', labelKey: 'alquileres.contratos.placeholders.sucursal.devolucionDireccion' },
    ],
  },
  {
    grupo: 'otros',
    labelKey: 'alquileres.contratos.placeholders.categorias.otros',
    placeholders: [
      { key: '{{fecha.actual}}', labelKey: 'alquileres.contratos.placeholders.otros.fechaActual' },
      { key: '{{contrato.numero}}', labelKey: 'alquileres.contratos.placeholders.otros.contratoNumero' },
    ],
  },
];

// Datos de ejemplo para preview en el editor de plantillas
export const DATOS_EJEMPLO: Record<string, string> = {
  '{{cliente.nombreCompleto}}': 'Juan Carlos Pérez',
  '{{cliente.email}}': 'juan.perez@ejemplo.com',
  '{{cliente.telefono}}': '+54 11 1234-5678',
  '{{cliente.documento}}': 'DNI: 30123456',
  '{{cliente.direccion}}': 'Av. Corrientes 1234, CABA',
  '{{vehiculo.marca}}': 'Toyota',
  '{{vehiculo.modelo}}': 'Corolla',
  '{{vehiculo.patente}}': 'ABC 123',
  '{{vehiculo.anio}}': '2024',
  '{{vehiculo.categoria}}': 'Sedán',
  '{{reserva.numero}}': 'R-2024-00001',
  '{{reserva.fechaRecogida}}': '15/03/2024 10:00',
  '{{reserva.fechaDevolucion}}': '20/03/2024 10:00',
  '{{reserva.precioTotal}}': '150.000,00',
  '{{reserva.deposito}}': '50.000,00',
  '{{reserva.moneda}}': 'ARS',
  '{{organizacion.nombre}}': 'Mi Empresa S.A.',
  '{{organizacion.cuit}}': '30-12345678-9',
  '{{sucursal.recogida.nombre}}': 'Sucursal Centro',
  '{{sucursal.recogida.direccion}}': 'Av. 9 de Julio 1000, CABA',
  '{{sucursal.devolucion.nombre}}': 'Sucursal Centro',
  '{{sucursal.devolucion.direccion}}': 'Av. 9 de Julio 1000, CABA',
  '{{fecha.actual}}': new Date().toLocaleDateString('es-AR'),
  '{{contrato.numero}}': 'CT-2024-00001',
};

/**
 * Reemplaza los placeholders en el HTML con los valores proporcionados.
 * Los placeholders no encontrados en `datos` se mantienen tal cual.
 */
export function reemplazarPlaceholders(
  html: string,
  datos: Record<string, string>,
): string {
  let resultado = html;
  for (const [placeholder, valor] of Object.entries(datos)) {
    resultado = resultado.split(placeholder).join(valor);
  }
  return resultado;
}
