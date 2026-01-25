/**
 * PageLoader - Componente de carga para Suspense boundaries
 * Usado como fallback mientras se cargan componentes lazy-loaded
 */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted text-sm">Cargando...</p>
      </div>
    </div>
  );
}
