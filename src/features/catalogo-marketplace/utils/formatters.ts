export function formatearPrecio(precio: number | null, moneda: string, consultarLabel = 'Consultar'): string {
  if (precio === null) return consultarLabel;

  const simbolos: Record<string, string> = {
    ARS: '$',
    USD: 'USD ',
    EUR: '€',
  };

  const simbolo = simbolos[moneda] || `${moneda} `;
  const precioFormateado = precio.toLocaleString(undefined);

  return `${simbolo}${precioFormateado}`;
}

export function formatearKilometraje(km: number): string {
  if (km === 0) return '0 km';
  return `${km.toLocaleString(undefined)} km`;
}

// formatearFecha eliminada: usar formatDate de @/shared/utils/dateFormatter
