/**
 * Types for imports feature
 */

export enum TipoImportacion {
  Vehiculos = 'vehiculos',
  Conductores = 'conductores',
  Dispositivos = 'dispositivos',
}

export interface ImportHistoryItem {
  id: string;
  fecha: Date;
  tipo: TipoImportacion;
  totalFilas: number;
  filasExitosas: number;
  filasConErrores: number;
  resultados?: any; // Full import results if stored
}
