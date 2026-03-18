/**
 * Esquemas de validacion compartidos con zod.
 * Cada schema recibe `t` (funcion de traduccion) para mensajes i18n.
 */
import { z } from 'zod';

// --- Helpers reutilizables ---

/** Campo string requerido (no vacio despues de trim) */
export const requiredString = (message: string) =>
  z.string().refine((v) => v.trim().length > 0, { message });

/** Campo email con formato valido */
export const emailField = (requiredMsg: string, invalidMsg: string) =>
  z.string()
    .refine((v) => v.trim().length > 0, { message: requiredMsg })
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), { message: invalidMsg });

/** Campo numerico positivo (recibido como string) */
export const positiveNumberString = (message: string) =>
  z.string().refine(
    (v) => {
      const n = parseFloat(v);
      return !isNaN(n) && n > 0;
    },
    { message },
  );

/** Campo numerico no negativo (recibido como string) */
export const nonNegativeNumberString = (message: string) =>
  z.string().refine(
    (v) => {
      const n = parseFloat(v);
      return !isNaN(n) && n >= 0;
    },
    { message },
  );

// --- Schema: Cliente de Alquiler ---

export function clienteFormSchema(t: (key: string) => string) {
  return z.object({
    nombre: requiredString(t('alquileres.clientes.form.nombreRequerido')),
    apellido: requiredString(t('alquileres.clientes.form.apellidoRequerido')),
    email: emailField(
      t('alquileres.clientes.form.emailRequerido'),
      t('alquileres.clientes.form.emailInvalido'),
    ),
    telefono: z.string(),
    tipoDocumento: z.number().refine((v) => v > 0, {
      message: t('alquileres.clientes.form.tipoDocumentoRequerido'),
    }),
    numeroDocumento: requiredString(t('alquileres.clientes.form.numeroDocumentoRequerido')),
    fechaNacimiento: z.string(),
    direccion: z.string(),
    ciudad: z.string(),
    provincia: z.string(),
    codigoPostal: z.string(),
    numeroLicenciaConducir: z.string(),
    vencimientoLicencia: z.string(),
    notas: z.string(),
  });
}

export type ClienteFormSchemaType = ReturnType<typeof clienteFormSchema>;

// --- Schema: Vehiculo de Alquiler ---

export function vehiculoAlquilerFormSchema(
  t: (key: string) => string,
  isEditMode: boolean,
) {
  return z
    .object({
      vehiculoId: z.string(),
      vehiculoLabel: z.string(),
      categoriaAlquiler: z.number(),
      precioBaseDiario: positiveNumberString(t('alquileres.flota.form.precioRequerido')),
      depositoMinimo: nonNegativeNumberString(t('alquileres.flota.form.depositoRequerido')),
      kilometrajeLimiteDiario: z.string().refine(
        (v) => {
          if (v.trim() === '') return true;
          const n = parseInt(v, 10);
          return !isNaN(n) && n > 0;
        },
        { message: t('alquileres.flota.form.kilometrajeInvalido') },
      ),
      precioPorKmExcedente: nonNegativeNumberString(t('alquileres.flota.form.precioPorKmRequerido')),
      politicaCombustible: z.number(),
      edadMinimaConductor: z.string().refine(
        (v) => {
          const n = parseInt(v, 10);
          return !isNaN(n) && n >= 18 && n <= 99;
        },
        { message: t('alquileres.flota.form.edadMinimaInvalida') },
      ),
      licenciaRequerida: z.string().refine(
        (v) => v.trim().length > 0 && v.trim().length <= 100,
        { message: t('alquileres.flota.form.licenciaRequeridaError') },
      ),
      sucursalPorDefectoId: requiredString(t('alquileres.flota.form.sucursalDefectoRequerida')),
      sucursalIds: z.array(z.string()).min(1, t('alquileres.flota.form.sucursalesRequeridas')),
    })
    .refine(
      (data) => {
        if (!isEditMode && !data.vehiculoId) return false;
        return true;
      },
      {
        message: t('alquileres.flota.form.vehiculoRequerido'),
        path: ['vehiculoId'],
      },
    )
    .refine(
      (data) => {
        if (data.sucursalIds.length > 0 && data.sucursalPorDefectoId) {
          return data.sucursalIds.includes(data.sucursalPorDefectoId);
        }
        return true;
      },
      {
        message: t('alquileres.flota.form.sucursalesDebeIncluirDefecto'),
        path: ['sucursalIds'],
      },
    );
}

export type VehiculoAlquilerFormSchemaType = ReturnType<typeof vehiculoAlquilerFormSchema>;

// --- Schema: Crear Vehiculo en Marketplace ---

export function createVehiculoMarketplaceSchema(t: (key: string) => string) {
  return z.object({
    patente: z.string().refine(
      (v) => v.trim().length > 0,
      { message: t('marketplace.form.patenteRequerida') },
    ),
    marca: z.string().nullable().optional(),
    modelo: z.string().nullable().optional(),
    anio: z.number().nullable().optional().refine(
      (v) => {
        if (v === null || v === undefined) return true;
        return v >= 1900 && v <= new Date().getFullYear() + 2;
      },
      { message: t('marketplace.form.anioInvalido') },
    ),
    precio: z.number().nullable().optional().refine(
      (v) => {
        if (v === null || v === undefined) return true;
        return v >= 0;
      },
      { message: t('marketplace.form.precioInvalido') },
    ),
    moneda: z.string().optional(),
    kilometraje: z.number().refine((v) => v >= 0, {
      message: t('marketplace.form.kilometrajeInvalido'),
    }),
    descripcion: z.string().nullable().optional().refine(
      (v) => {
        if (!v) return true;
        return v.length <= 4000;
      },
      { message: t('marketplace.form.descripcionMuyLarga') },
    ),
    estado: z.number().optional(),
    vehiculoId: z.string().nullable().optional(),
  });
}

export type CreateVehiculoMarketplaceSchemaType = ReturnType<typeof createVehiculoMarketplaceSchema>;

// --- Schema: Registro Cliente B2C (alquiler publico) ---

export function registroClienteSchema(t: (key: string) => string) {
  return z.object({
    nombre: requiredString(t('alquilerPublico.auth.errores.nombreRequerido')),
    apellido: requiredString(t('alquilerPublico.auth.errores.apellidoRequerido')),
    email: emailField(
      t('alquilerPublico.auth.errores.emailRequerido'),
      t('alquilerPublico.auth.errores.emailInvalido'),
    ),
    telefono: z.string(),
    tipoDocumento: z.union([z.number(), z.literal('')]).refine(
      (v) => v !== '' && v > 0,
      { message: t('alquilerPublico.auth.errores.tipoDocRequerido') },
    ),
    numeroDocumento: requiredString(t('alquilerPublico.auth.errores.numDocRequerido')),
  });
}

export type RegistroClienteSchemaType = ReturnType<typeof registroClienteSchema>;
