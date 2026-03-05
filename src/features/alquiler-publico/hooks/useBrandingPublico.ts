import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { alquilerPublicoApi } from '@/services/endpoints';
import type { BrandingPublicoDto } from '../types/branding';

const BRANDING_DEFAULTS: BrandingPublicoDto = {
  organizacionNombre: 'TracAuto Alquiler',
  logoUrl: null,
  primary: null,
  primaryDark: null,
  secondary: null,
};

/**
 * Carga branding de la org desde la API publica y aplica CSS variables.
 * Fallback gracioso: si el endpoint falla (404, backend no implementado aun),
 * usa valores por defecto sin mostrar error al usuario.
 */
export function useBrandingPublico() {
  const { data, isLoading } = useQuery({
    queryKey: ['alquiler-publico-branding'],
    queryFn: () => alquilerPublicoApi.getBranding(),
    staleTime: 30 * 60 * 1000, // 30 min — branding cambia raramente
    retry: false, // Si falla, usar defaults sin reintentar
  });

  const branding = data ?? BRANDING_DEFAULTS;

  // Aplicar CSS variables de branding al :root
  useEffect(() => {
    if (!data) return;
    const root = document.documentElement;
    if (data.primary) root.style.setProperty('--color-primary', data.primary);
    if (data.primaryDark) root.style.setProperty('--color-primary-dark', data.primaryDark);
    if (data.secondary) root.style.setProperty('--color-secondary', data.secondary);
  }, [data]);

  return { branding, isLoading };
}
