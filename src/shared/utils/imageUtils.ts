/**
 * Utilidades de validación y compresión de imágenes para inspecciones
 */

export const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FOTOS = 10;
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50MB
const TARGET_MAX_DIMENSION = 1920;
const TARGET_QUALITY = 0.8;

/**
 * Valida tipo MIME de una imagen.
 * Retorna i18n key de error o null si es válida.
 */
export function validarImagen(file: File): string | null {
  if (!TIPOS_IMAGEN_PERMITIDOS.includes(file.type)) {
    return 'alquileres.reservaDetalle.fotos.errorTipo';
  }
  return null;
}

/**
 * Valida un lote de imágenes contra límites de cantidad y tamaño.
 * @param archivosNuevos - Archivos a agregar
 * @param cantidadExistente - Cantidad de fotos ya cargadas
 */
export function validarLoteImagenes(archivosNuevos: File[], cantidadExistente: number): string | null {
  if (cantidadExistente + archivosNuevos.length > MAX_FOTOS) {
    return 'alquileres.reservaDetalle.fotos.errorCantidad';
  }

  const totalBytes = archivosNuevos.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    return 'alquileres.reservaDetalle.fotos.errorTamano';
  }

  return null;
}

/**
 * Comprime una imagen usando Canvas API.
 * - Redimensiona a max 1920px en el lado mayor
 * - Calidad 0.8 para jpeg/webp
 * - Si la imagen ya es pequeña y jpeg/webp, retorna sin cambios
 */
export async function comprimirImagen(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = img;

      // Si ya es pequeña y formato eficiente, retornar sin cambios
      const esFormatoEficiente = file.type === 'image/jpeg' || file.type === 'image/webp';
      if (width <= TARGET_MAX_DIMENSION && height <= TARGET_MAX_DIMENSION && esFormatoEficiente) {
        resolve(file);
        return;
      }

      // Calcular nuevas dimensiones
      let newWidth = width;
      let newHeight = height;
      if (width > TARGET_MAX_DIMENSION || height > TARGET_MAX_DIMENSION) {
        const ratio = Math.min(TARGET_MAX_DIMENSION / width, TARGET_MAX_DIMENSION / height);
        newWidth = Math.round(width * ratio);
        newHeight = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convertir a webp para mejor compresión (PNG → webp, JPEG se mantiene)
      const outputType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
      const extension = outputType === 'image/jpeg' ? '.jpg' : '.webp';
      const nombreBase = file.name.replace(/\.[^.]+$/, '');

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], `${nombreBase}${extension}`, { type: outputType }));
        },
        outputType,
        TARGET_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error al cargar imagen para compresión'));
    };

    img.src = url;
  });
}
