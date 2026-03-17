/**
 * Helpers para manejar extensiones de vehículos
 * Migrado de TipoOrganizacion a ModuloSistema (feature gating por módulos)
 */

import { ModuloSistema } from '@/shared/types/api';
import { TipoExtensionVehiculo } from '../types';

/**
 * Obtiene la extensión predeterminada según los módulos activos
 */
export function getDefaultExtensionForModulos(
  modulosActivos: number[]
): TipoExtensionVehiculo {
  if (modulosActivos.includes(ModuloSistema.Seguros)) {
    return TipoExtensionVehiculo.Aseguradora;
  }
  if (modulosActivos.includes(ModuloSistema.Marketplace)) {
    return TipoExtensionVehiculo.Marketplace;
  }
  return TipoExtensionVehiculo.Ninguno;
}

/**
 * Determina si se debe mostrar el formulario de extensión según los módulos activos
 */
export function shouldShowExtensionForm(modulosActivos: number[]): boolean {
  return modulosActivos.includes(ModuloSistema.Seguros) ||
    modulosActivos.includes(ModuloSistema.Marketplace) ||
    modulosActivos.includes(ModuloSistema.Flota) ||
    modulosActivos.includes(ModuloSistema.Taller);
}

/**
 * Obtiene el tipo de extensión que debe mostrarse según los módulos activos
 */
export function getExtensionTypeForModulos(
  modulosActivos: number[]
): TipoExtensionVehiculo {
  if (modulosActivos.includes(ModuloSistema.Seguros)) {
    return TipoExtensionVehiculo.Aseguradora;
  }
  if (modulosActivos.includes(ModuloSistema.Marketplace)) {
    return TipoExtensionVehiculo.Marketplace;
  }
  if (modulosActivos.includes(ModuloSistema.Flota)) {
    return TipoExtensionVehiculo.Taxi;
  }
  if (modulosActivos.includes(ModuloSistema.Taller)) {
    return TipoExtensionVehiculo.Otros;
  }
  return TipoExtensionVehiculo.Ninguno;
}
