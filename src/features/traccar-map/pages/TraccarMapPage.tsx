import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MapShell } from '../components/MapShell';
import { VehiclesSidebar } from '../components/VehiclesSidebar';
import { MapView } from '../components/MapView';
import { useTraccarMapStore } from '../store/traccarMap.store';
import { getVehiclePositions } from '@/services/traccar/traccarMap.api';
import { useMapRealTime } from '../hooks/useMapRealTime';
import { useAuthStore } from '@/store';
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
  const { t } = useTranslation();
  return (
    <div className="w-full h-full bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-text-muted">
        <Loader2 size={48} className="animate-spin" />
        <p className="text-sm">{t('map.loading')}</p>
      </div>
    </div>
  );
}

// Error state component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-88px)] -m-6 bg-background">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
            <AlertCircle size={32} className="text-error" />
          </div>
          <h2 className="text-xl font-semibold text-text">{t('map.loadError')}</h2>
          <p className="text-text-muted">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            {t('map.retry')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Empty state when no vehicles exist
function EmptyState({ isPersonalContext }: { isPersonalContext: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-88px)] -m-6 bg-background">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
            <MapPin size={32} className="text-text-muted" />
          </div>
          <h2 className="text-xl font-semibold text-text">{t('map.empty')}</h2>
          <p className="text-text-muted">
            {isPersonalContext
              ? t('map.personal.emptyDescription', { defaultValue: 'Todavia no hay posiciones personales para mostrar. Necesitas al menos un vehiculo propio con un dispositivo propio asignado.' })
              : t('map.emptyDescription')}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/vehiculos"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-primary-dark"
            >{t('map.viewVehicles', { defaultValue: 'Ver vehiculos' })}</Link>
            <Link
              to="/dispositivos"
              className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-4 py-2 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
            >
              Ver dispositivos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TraccarMapPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isPersonalContext =
    user?.contextoActivo?.tipo === 'Personal' ||
    (!!user && !user.organizationId);
  const { isLoading, error, vehicles, setVehicles, setLoading, setError, resetState } =
    useTraccarMapStore();
  const contextKey = user
    ? `${user.id}:${user.contextoActivo.tipo}:${user.contextoActivo.id ?? 'personal'}`
    : 'anon';

  // Real-time updates via SignalR with polling fallback
  useMapRealTime();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVehiclePositions();
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setVehicles, t]);

  useEffect(() => {
    void loadData();

    return () => {
      resetState();
    };
  }, [contextKey, loadData, resetState]);

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
    return <EmptyState isPersonalContext={isPersonalContext} />;
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

