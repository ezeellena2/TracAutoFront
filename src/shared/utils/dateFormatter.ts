/**
 * Formatters de fecha/hora usando Intl.DateTimeFormat
 * Respetan timezone y culture efectivos de la organización
 */

/**
 * Formatea una fecha/hora completa usando timezone y culture efectivos
 * @param date Fecha a formatear (puede ser Date o string ISO)
 * @param culture Culture code (ej: "es-AR", "en-US")
 * @param timeZoneId Timezone IANA (ej: "America/Argentina/Buenos_Aires")
 * @returns String formateado (ej: "15/01/2025, 10:30:45")
 */
export function formatDateTime(
  date: Date | string,
  culture: string,
  timeZoneId: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(culture, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timeZoneId,
  }).format(dateObj);
}

/**
 * Formatea solo la fecha (sin hora) usando timezone y culture efectivos
 * @param date Fecha a formatear (puede ser Date o string ISO)
 * @param culture Culture code (ej: "es-AR", "en-US")
 * @param timeZoneId Timezone IANA (ej: "America/Argentina/Buenos_Aires")
 * @returns String formateado (ej: "15/01/2025")
 */
export function formatDate(
  date: Date | string,
  culture: string,
  timeZoneId: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(culture, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timeZoneId,
  }).format(dateObj);
}

/**
 * Formatea solo la hora (sin fecha) usando timezone y culture efectivos
 * @param date Fecha a formatear (puede ser Date o string ISO)
 * @param culture Culture code (ej: "es-AR", "en-US")
 * @param timeZoneId Timezone IANA (ej: "America/Argentina/Buenos_Aires")
 * @returns String formateado (ej: "10:30:45")
 */
export function formatTime(
  date: Date | string,
  culture: string,
  timeZoneId: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(culture, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timeZoneId,
  }).format(dateObj);
}

/**
 * Formatea fecha corta (solo día y mes) usando timezone y culture efectivos
 * @param date Fecha a formatear (puede ser Date o string ISO)
 * @param culture Culture code (ej: "es-AR", "en-US")
 * @param timeZoneId Timezone IANA (ej: "America/Argentina/Buenos_Aires")
 * @returns String formateado (ej: "15/01")
 */
export function formatDateShort(
  date: Date | string,
  culture: string,
  timeZoneId: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(culture, {
    month: '2-digit',
    day: '2-digit',
    timeZone: timeZoneId,
  }).format(dateObj);
}

/**
 * Formatea una fecha para usar en input type="datetime-local"
 * Formato: YYYY-MM-DDTHH:mm (hora local, sin timezone)
 * @param date Fecha a formatear
 * @returns String en formato YYYY-MM-DDTHH:mm
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
