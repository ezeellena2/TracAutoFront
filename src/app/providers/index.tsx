import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLayoutEffect, useRef } from 'react';
import { useTenantStore, useThemeStore } from '@/store';
import { I18nProvider } from './I18nProvider';
import '@/shared/i18n/config'; // Inicializar i18n

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
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

  // Aplicar theme cuando cambia la organización O el modo dark/light
  // Usa refs para detectar cambios reales y evitar loops
  useLayoutEffect(() => {
    const orgId = currentOrganization?.id ?? null;
    const orgChanged = prevOrgIdRef.current !== orgId;
    const modeChanged = prevIsDarkModeRef.current !== isDarkMode;

    if (currentOrganization && (orgChanged || modeChanged)) {
      // Aplicar tema base (según isDarkMode) + override de organización
      setDarkMode(isDarkMode, currentOrganization.theme);
      prevOrgIdRef.current = orgId;
      prevIsDarkModeRef.current = isDarkMode;
    } else if (!currentOrganization && orgChanged) {
      // Si no hay organización (logout), resetear a default
      resetToDefault();
      prevOrgIdRef.current = null;
    }
  }, [currentOrganization, isDarkMode, setDarkMode, resetToDefault]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        {children}
      </I18nProvider>
    </QueryClientProvider>
  );
}
