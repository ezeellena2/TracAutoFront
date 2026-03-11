/**
 * Detección del modo de aplicación por subdominio.
 * Un solo build sirve 3 apps: B2B, Marketplace y Alquiler.
 * El hostname determina cuál se carga en runtime.
 * En desarrollo, VITE_APP_MODE permite forzar el modo.
 */

export type AppMode = 'b2b' | 'marketplace' | 'alquiler';

export function detectAppMode(): AppMode {
  const hostname = window.location.hostname;

  if (hostname.startsWith('marketplace.')) return 'marketplace';
  if (hostname.startsWith('alquiler.')) return 'alquiler';

  // Override por env var o Vite mode (solo disponible en dev)
  const override = import.meta.env.VITE_APP_MODE as AppMode | undefined;
  if (override && ['b2b', 'marketplace', 'alquiler'].includes(override)) {
    return override;
  }

  // Fallback: Vite --mode flag (dev:marketplace, dev:alquiler scripts)
  const viteMode = import.meta.env.MODE as string | undefined;
  if (viteMode && ['marketplace', 'alquiler'].includes(viteMode)) {
    return viteMode as AppMode;
  }

  return 'b2b';
}
