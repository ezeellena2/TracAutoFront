/**
 * Formatters de números y unidades con conversión métrico/imperial
 * Respetan measurementSystem y culture efectivos de la organización
 */

// Constantes de conversión
const KM_TO_MI = 0.621371;
const KMH_TO_MPH = 0.621371;

/**
 * Convierte velocidad de km/h a mph
 */
function kmhToMph(kmh: number): number {
  return kmh * KMH_TO_MPH;
}

/**
 * Convierte distancia de km a millas
 */
function kmToMi(km: number): number {
  return km * KM_TO_MI;
}

/**
 * Formatea velocidad según el sistema de medición efectivo
 * @param speedKmh Velocidad en km/h (canonical interno)
 * @param measurementSystem 0=Metric, 1=Imperial
 * @param culture Culture code para formateo de números (ej: "es-AR", "en-US")
 * @returns String formateado con unidad (ej: "60 km/h" o "37.3 mph")
 */
export function formatSpeed(
  speedKmh: number,
  measurementSystem: number,
  culture: string
): string {
  const isMetric = measurementSystem === 0;
  
  if (isMetric) {
    const formatted = new Intl.NumberFormat(culture, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    }).format(speedKmh);
    return `${formatted} km/h`;
  } else {
    const mph = kmhToMph(speedKmh);
    const formatted = new Intl.NumberFormat(culture, {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    }).format(mph);
    return `${formatted} mph`;
  }
}

/**
 * Formatea distancia según el sistema de medición efectivo
 * @param distanceKm Distancia en km (canonical interno)
 * @param measurementSystem 0=Metric, 1=Imperial
 * @param culture Culture code para formateo de números (ej: "es-AR", "en-US")
 * @returns String formateado con unidad (ej: "100 km" o "62.1 mi")
 */
export function formatDistance(
  distanceKm: number,
  measurementSystem: number,
  culture: string
): string {
  const isMetric = measurementSystem === 0;
  
  if (isMetric) {
    const formatted = new Intl.NumberFormat(culture, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(distanceKm);
    return `${formatted} km`;
  } else {
    const mi = kmToMi(distanceKm);
    const formatted = new Intl.NumberFormat(culture, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(mi);
    return `${formatted} mi`;
  }
}

/**
 * Formatea un número genérico según culture
 * @param value Número a formatear
 * @param culture Culture code para formateo (ej: "es-AR", "en-US")
 * @param decimals Número de decimales (opcional, default: 0)
 * @returns String formateado (ej: "1.234,56" o "1,234.56")
 */
export function formatNumber(
  value: number,
  culture: string,
  decimals: number = 0
): string {
  return new Intl.NumberFormat(culture, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

/**
 * Convierte velocidad de km/h a la unidad del sistema efectivo (sin formatear)
 * @param speedKmh Velocidad en km/h
 * @param measurementSystem 0=Metric, 1=Imperial
 * @returns Velocidad en km/h (Metric) o mph (Imperial)
 */
export function convertSpeed(
  speedKmh: number,
  measurementSystem: number
): number {
  return measurementSystem === 0 ? speedKmh : kmhToMph(speedKmh);
}

/**
 * Convierte distancia de km a la unidad del sistema efectivo (sin formatear)
 * @param distanceKm Distancia en km
 * @param measurementSystem 0=Metric, 1=Imperial
 * @returns Distancia en km (Metric) o millas (Imperial)
 */
export function convertDistance(
  distanceKm: number,
  measurementSystem: number
): number {
  return measurementSystem === 0 ? distanceKm : kmToMi(distanceKm);
}

