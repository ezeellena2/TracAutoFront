import { useEffect } from 'react';
import { MapShell } from '../components/MapShell';
import { VehiclesSidebar } from '../components/VehiclesSidebar';
import { MapView } from '../components/MapView';
import { useTraccarMapStore } from '../store/traccarMap.store';
import { getVehiclePositions } from '@/services/traccar/traccarMap.api';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';

// Loading skeleton for sidebar
function SidebarSkeleton() {
  return (
    <div className="flex flex-col h-full bg-surface border-r border-border animate-pulse">
      <div className="p-4 border-b border-border">
        <div className="h-6 bg-background rounded w-24 mb-3" />
        <div className="h-10 bg-background rounded" />
      </div>
      <div className="flex-1 p-2 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-background rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// Loading state for map
function MapLoadingSkeleton() {
  return (
    <div className="w-full h-full bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-text-muted">
        <Loader2 size={48} className="animate-spin" />
        <p className="text-sm">Cargando mapa...</p>
      </div>
    </div>
  );
}

// Error boundary component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-88px)] -m-6 bg-background">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
            <AlertCircle size={32} className="text-error" />
          </div>
          <h2 className="text-xl font-semibold text-text">Error al cargar datos</h2>
          <p className="text-text-muted">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}

// Empty state when no vehicles exist
function EmptyState() {
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-88px)] -m-6 bg-background">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
            <MapPin size={32} className="text-text-muted" />
          </div>
          <h2 className="text-xl font-semibold text-text">Sin vehículos</h2>
          <p className="text-text-muted">
            No hay vehículos disponibles para mostrar en el mapa.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TraccarMapPage() {
  const { isLoading, error, vehicles, setVehicles, setLoading, setError, resetState } =
    useTraccarMapStore();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVehiclePositions();
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Cleanup on unmount
    return () => {
      resetState();
    };
  }, []);

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={loadData} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <MapShell
        sidebar={<SidebarSkeleton />}
        map={<MapLoadingSkeleton />}
        itemCount={0}
      />
    );
  }

  // Empty state
  if (vehicles.length === 0) {
    return <EmptyState />;
  }

  // Normal render
  return (
    <MapShell
      sidebar={<VehiclesSidebar />}
      map={<MapView />}
      itemCount={vehicles.length}
    />
  );
}
