/**
 * Shared stock status utilities for device components.
 * Centralizes label/variant mappings to avoid duplication (S-01).
 */
import { EstadoStockDispositivo } from '@/shared/types/api';

/** i18n translation keys for each stock status */
export const stockStatusLabels: Record<EstadoStockDispositivo, string> = {
  [EstadoStockDispositivo.EnStock]: 'devices.stock.status.enStock',
  [EstadoStockDispositivo.Instalado]: 'devices.stock.status.instalado',
  [EstadoStockDispositivo.EnReparacion]: 'devices.stock.status.enReparacion',
  [EstadoStockDispositivo.DadoDeBaja]: 'devices.stock.status.dadoDeBaja',
};

/** Badge variant for each stock status */
export const stockBadgeVariants: Record<EstadoStockDispositivo, 'success' | 'info' | 'warning' | 'error'> = {
  [EstadoStockDispositivo.EnStock]: 'success',
  [EstadoStockDispositivo.Instalado]: 'info',
  [EstadoStockDispositivo.EnReparacion]: 'warning',
  [EstadoStockDispositivo.DadoDeBaja]: 'error',
};

/** Tailwind color classes for each stock status (used in public pages) */
export const stockStatusColors: Record<EstadoStockDispositivo, string> = {
  [EstadoStockDispositivo.EnStock]: 'bg-emerald-500',
  [EstadoStockDispositivo.Instalado]: 'bg-blue-500',
  [EstadoStockDispositivo.EnReparacion]: 'bg-amber-500',
  [EstadoStockDispositivo.DadoDeBaja]: 'bg-red-500',
};
