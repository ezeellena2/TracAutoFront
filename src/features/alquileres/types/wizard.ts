/**
 * Tipos para el wizard de creacion de reserva
 * Estado del formulario multi-paso y errores de validacion
 */

import type { ClienteAlquilerDto } from './cliente';
import type { VehiculoAlquilerDto } from './vehiculoAlquiler';
import { OrigenReserva } from './reserva';

// --- Estado por paso ---

export interface WizardClienteData {
  clienteExistenteId: string | null;
  clienteExistente: ClienteAlquilerDto | null;
  creandoNuevo: boolean;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  tipoDocumento: number | '';
  numeroDocumento: string;
  fechaNacimiento: string;
  numeroLicenciaConducir: string;
  vencimientoLicencia: string;
}

export interface WizardVehiculoData {
  categoriaAlquiler: number | '';
  vehiculoAlquilerId: string | null;
  vehiculoSeleccionado: VehiculoAlquilerDto | null;
  sucursalRecogidaId: string;
  sucursalDevolucionId: string;
  mismaSucursal: boolean;
  fechaHoraRecogida: string;
  fechaHoraDevolucion: string;
}

export interface WizardOpcionesData {
  recargosSeleccionadosIds: string[];
  coberturasSeleccionadasIds: string[];
  codigoPromocion: string;
}

export interface WizardFormData {
  cliente: WizardClienteData;
  vehiculo: WizardVehiculoData;
  opciones: WizardOpcionesData;
  notas: string;
  origenReserva: number;
  claveIdempotencia: string;
}

// --- Errores de validacion por paso ---

export interface WizardClienteErrors {
  clienteExistente?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
}

export interface WizardVehiculoErrors {
  categoriaAlquiler?: string;
  sucursalRecogidaId?: string;
  sucursalDevolucionId?: string;
  fechaHoraRecogida?: string;
  fechaHoraDevolucion?: string;
  fechasRango?: string;
}

// --- Valores iniciales ---

export const WIZARD_CLIENTE_INITIAL: WizardClienteData = {
  clienteExistenteId: null,
  clienteExistente: null,
  creandoNuevo: false,
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  tipoDocumento: '',
  numeroDocumento: '',
  fechaNacimiento: '',
  numeroLicenciaConducir: '',
  vencimientoLicencia: '',
};

export const WIZARD_VEHICULO_INITIAL: WizardVehiculoData = {
  categoriaAlquiler: '',
  vehiculoAlquilerId: null,
  vehiculoSeleccionado: null,
  sucursalRecogidaId: '',
  sucursalDevolucionId: '',
  mismaSucursal: true,
  fechaHoraRecogida: '',
  fechaHoraDevolucion: '',
};

export const WIZARD_OPCIONES_INITIAL: WizardOpcionesData = {
  recargosSeleccionadosIds: [],
  coberturasSeleccionadasIds: [],
  codigoPromocion: '',
};

export const WIZARD_FORM_INITIAL: WizardFormData = {
  cliente: WIZARD_CLIENTE_INITIAL,
  vehiculo: WIZARD_VEHICULO_INITIAL,
  opciones: WIZARD_OPCIONES_INITIAL,
  notas: '',
  origenReserva: OrigenReserva.Presencial,
  claveIdempotencia: crypto.randomUUID(),
};
