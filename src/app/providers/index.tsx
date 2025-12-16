import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLayoutEffect } from 'react';
import { useTenantStore, useThemeStore } from '@/store';

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

  // Aplicar theme cuando cambia la organización: tema base (según isDarkMode) + override
  useLayoutEffect(() => {
    if (currentOrganization) {
      // Usar tema base según isDarkMode + override de organización
      setDarkMode(isDarkMode, currentOrganization.theme);
    } else {
      resetToDefault();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization]); // Solo cuando cambia la organización

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
