import { z } from 'zod';

export const requiredString = (message: string) =>
  z.string().refine((v) => v.trim().length > 0, { message });

export const emailField = (requiredMsg: string, invalidMsg: string) =>
  z.string()
    .refine((v) => v.trim().length > 0, { message: requiredMsg })
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), { message: invalidMsg });

export const positiveNumberString = (message: string) =>
  z.string().refine((v) => {
    const n = parseFloat(v);
    return !isNaN(n) && n > 0;
  }, { message });

export const nonNegativeNumberString = (message: string) =>
  z.string().refine((v) => {
    const n = parseFloat(v);
    return !isNaN(n) && n >= 0;
  }, { message });

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
