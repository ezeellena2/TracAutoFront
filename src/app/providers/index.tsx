import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HelmetProvider } from 'react-helmet-async';
import { useLayoutEffect, useRef } from 'react';
import { useTenantStore, useThemeStore } from '@/store';
import { I18nProvider } from './I18nProvider';
import { OfflineIndicator } from '@/shared/ui';
import { env } from '@/config/env';
import { detectAppMode } from '@/config/appMode';
import '@/shared/i18n/config'; // Inicializar i18n

const appMode = detectAppMode();

/**
 * Función de retry inteligente para React Query.
 * - No reintenta errores 4xx (son definitivos: validación, not found, forbidden)
 * - Reintenta hasta 3 veces para errores 5xx, de red o timeout
 * - Usa backoff exponencial: 1s, 2s, 4s
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  // Máximo 3 reintentos
  if (failureCount >= 3) return false;

  // Extraer status del error
  const status = (error as { status?: number })?.status;

  // No reintentar errores 4xx (son definitivos)
  if (status && status >= 400 && status < 500) {
    return false;
  }

  // Reintentar errores 5xx, de red o desconocidos
  return true;
}

/**
 * Delay con backoff exponencial para retries
 */
function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 5, // 5 minutos: datos inactivos se eliminan tras este tiempo
      retry: shouldRetry,
      retryDelay: retryDelay,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: shouldRetry,
      retryDelay: retryDelay,
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const { currentOrganization } = useTenantStore();
  const { isDarkMode, setDarkMode, resetToDefault } = useThemeStore();

  // Refs para trackear cambios reales y prevenir re-ejecuciones innecesarias
  const prevOrgIdRef = useRef<string | null>(null);
  const prevIsDarkModeRef = useRef<boolean>(isDarkMode);

  // Sincronizar theme con org solo en B2B (Marketplace/Alquiler usan branding propio)
  useLayoutEffect(() => {
    if (appMode !== 'b2b') return;

    const orgId = currentOrganization?.id ?? null;
    const orgChanged = prevOrgIdRef.current !== orgId;
    const modeChanged = prevIsDarkModeRef.current !== isDarkMode;

    if (currentOrganization && (orgChanged || modeChanged)) {
      setDarkMode(isDarkMode, currentOrganization.theme);
      prevOrgIdRef.current = orgId;
      prevIsDarkModeRef.current = isDarkMode;
    } else if (!currentOrganization && orgChanged) {
      resetToDefault();
      prevOrgIdRef.current = null;
    }
  }, [currentOrganization, isDarkMode, setDarkMode, resetToDefault]);

  return (
    <HelmetProvider>
      <GoogleOAuthProvider clientId={env.googleClientId}>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            {children}
            <OfflineIndicator />
          </I18nProvider>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  );
}
