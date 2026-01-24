/**
 * File utility functions
 */

/**
 * Downloads a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates if a file is an Excel file (.xlsx)
 */
export function isValidExcelFile(file: File): boolean {
  return file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.name.toLowerCase().endsWith('.xlsx');
}

/**
 * Formats file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Maximum file size for Excel imports (10MB)
 */
export const MAX_EXCEL_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates file for Excel import
 * Returns error message if invalid, null if valid
 */
export function validateExcelFile(file: File): string | null {
  if (!isValidExcelFile(file)) {
    return 'Solo se permiten archivos .xlsx';
  }
  if (file.size > MAX_EXCEL_FILE_SIZE) {
    return `El archivo no puede exceder ${formatFileSize(MAX_EXCEL_FILE_SIZE)}`;
  }
  return null;
}
