import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
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
  const { applyThemeToCSSVariables, resetToDefault } = useThemeStore();

  // Aplicar theme al cargar si hay una organización seleccionada
  useEffect(() => {
    if (currentOrganization) {
      applyThemeToCSSVariables(currentOrganization.theme);
    } else {
      resetToDefault();
    }
  }, [currentOrganization, applyThemeToCSSVariables, resetToDefault]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
