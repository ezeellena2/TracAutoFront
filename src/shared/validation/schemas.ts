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
