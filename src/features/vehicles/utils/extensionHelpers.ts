/**
 * Helpers para manejar extensiones de vehículos
 */

import { TipoOrganizacion } from '@/shared/types/api';
import { TipoExtensionVehiculo } from '../types';

/**
 * Obtiene la extensión predeterminada según el tipo de organización
 */
export function getDefaultExtensionForOrgType(
  orgType: TipoOrganizacion | undefined
): TipoExtensionVehiculo {
  switch (orgType) {
    case TipoOrganizacion.Aseguradora:
      return TipoExtensionVehiculo.Aseguradora;
    case TipoOrganizacion.ConcesionarioAutos:
      return TipoExtensionVehiculo.Marketplace;
    case TipoOrganizacion.EmpresaRenting:
      return TipoExtensionVehiculo.Alquiler;
    default:
      return TipoExtensionVehiculo.Ninguno;
  }
}

/**
 * Determina si una organización debe mostrar formulario de extensión en VehiclesPage
 */
export function shouldShowExtensionForm(orgType: TipoOrganizacion | undefined): boolean {
  switch (orgType) {
    case TipoOrganizacion.Aseguradora:
    case TipoOrganizacion.EmpresaRenting:
    case TipoOrganizacion.FlotaPrivada:
    case TipoOrganizacion.TallerMecanico:
    case TipoOrganizacion.ConcesionarioAutos:
      return true;
    default:
      return false;
  }
}

/**
 * Obtiene el tipo de extensión que debe mostrarse para una organización
 */
export function getExtensionTypeForOrgType(
  orgType: TipoOrganizacion | undefined
): TipoExtensionVehiculo {
  switch (orgType) {
    case TipoOrganizacion.Aseguradora:
      return TipoExtensionVehiculo.Aseguradora;
    case TipoOrganizacion.ConcesionarioAutos:
      return TipoExtensionVehiculo.Marketplace;
    case TipoOrganizacion.EmpresaRenting:
      return TipoExtensionVehiculo.Alquiler;
    case TipoOrganizacion.FlotaPrivada:
      return TipoExtensionVehiculo.Taxi;
    case TipoOrganizacion.TallerMecanico:
      return TipoExtensionVehiculo.Otros;
    default:
      return TipoExtensionVehiculo.Ninguno;
  }
}
