/**
 * Detección del modo de aplicación por subdominio.
 * Un solo build sirve 2 apps: B2B y Marketplace.
 * El hostname determina cuál se carga en runtime.
 * En desarrollo, VITE_APP_MODE permite forzar el modo.
 */

export type AppMode = 'b2b' | 'marketplace';

export function detectAppMode(): AppMode {
  const hostname = window.location.hostname;

  if (hostname.startsWith('marketplace.')) return 'marketplace';
  // Override por env var o Vite mode (solo disponible en dev)
  const override = import.meta.env.VITE_APP_MODE as AppMode | undefined;
  if (override && ['b2b', 'marketplace'].includes(override)) {
    return override;
  }

  // Fallback: Vite --mode flag
  const viteMode = import.meta.env.MODE as string | undefined;
  if (viteMode && ['marketplace'].includes(viteMode)) {
    return viteMode as AppMode;
  }

  return 'b2b';
}
