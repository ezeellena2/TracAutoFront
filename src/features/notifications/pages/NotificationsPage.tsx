import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, PaginationControls } from '@/shared/ui';
import { notificacionesApi } from '@/services/endpoints';
import type { ListaPaginada } from '@/shared/types/api';
import { CategoriaNotificacion } from '@/shared/types/notifications';
import type { NotificacionDto } from '@/shared/types/notifications';
import { NotificationItem } from '../components/NotificationItem';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationsPage() {
  const { t } = useTranslation();
  const { markAsRead, markAllAsRead, archivar } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ListaPaginada<NotificacionDto> | null>(null);
  const [pagina, setPagina] = useState(1);
  const [tamano, setTamano] = useState(10);
  const [leidas, setLeidas] = useState<'ALL' | 'READ' | 'UNREAD'>('ALL');
  const [categoria, setCategoria] = useState<CategoriaNotificacion | 'ALL'>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  const categorias: { value: CategoriaNotificacion | 'ALL'; label: string }[] = [
    { value: 'ALL', label: t('notifications.categories.all') },
    { value: CategoriaNotificacion.Geofence, label: t('notifications.categories.geofence') },
    { value: CategoriaNotificacion.Vehiculo, label: t('notifications.categories.vehiculo') },
    { value: CategoriaNotificacion.Conductor, label: t('notifications.categories.conductor') },
    { value: CategoriaNotificacion.Sistema, label: t('notifications.categories.sistema') },
    { value: CategoriaNotificacion.Seguridad, label: t('notifications.categories.seguridad') },
    { value: CategoriaNotificacion.Solicitud, label: t('notifications.categories.solicitud') },
    { value: CategoriaNotificacion.Mantenimiento, label: t('notifications.categories.mantenimiento') },
  ];

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      setIsLoading(true);
      const result = await notificacionesApi.getNotificaciones({
        numeroPagina: pagina,
        tamanoPagina: tamano,
        archivadas: false,
        ...(leidas === 'READ' ? { leidas: true } : {}),
        ...(leidas === 'UNREAD' ? { leidas: false } : {}),
        ...(categoria !== 'ALL' ? { categoria } : {}),
      });
      if (!cancel) setData(result);
      if (!cancel) setIsLoading(false);
    };

    void load();
    return () => {
      cancel = true;
    };
  }, [pagina, tamano, leidas, categoria, refreshKey]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    await markAsRead(id);
    setRefreshKey((k) => k + 1);
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
    setRefreshKey((k) => k + 1);
  }, [markAllAsRead]);

  const handleArchivar = useCallback(async (id: string) => {
    await archivar(id);
    setRefreshKey((k) => k + 1);
  }, [archivar]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <h1 className="text-xl font-semibold text-text">{t('notifications.centerTitle')}</h1>
          <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
            {t('notifications.actions.markAllAsRead')}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <select
            className="border border-border bg-surface rounded-lg px-3 py-2 text-sm text-text"
            value={leidas}
            onChange={(e) => {
              setPagina(1);
              setLeidas(e.target.value as 'ALL' | 'READ' | 'UNREAD');
            }}
          >
            <option value="ALL">{t('notifications.filters.all')}</option>
            <option value="UNREAD">{t('notifications.filters.unread')}</option>
            <option value="READ">{t('notifications.filters.read')}</option>
          </select>

          <select
            className="border border-border bg-surface rounded-lg px-3 py-2 text-sm text-text"
            value={categoria}
            onChange={(e) => {
              setPagina(1);
              setCategoria(e.target.value as CategoriaNotificacion | 'ALL');
            }}
          >
            {categorias.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="p-4">
        {isLoading ? (
          <p className="text-sm text-text-muted">{t('notifications.loading')}</p>
        ) : !data || data.items.length === 0 ? (
          <p className="text-sm text-text-muted">{t('notifications.emptyByFilter')}</p>
        ) : (
          <div className="space-y-2">
            {data.items.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onMarkAsRead={handleMarkAsRead}
                onArchivar={handleArchivar}
              />
            ))}
          </div>
        )}

        {data && data.totalRegistros > 0 && (
          <div className="mt-4">
            <PaginationControls
              paginaActual={data.paginaActual}
              totalPaginas={data.totalPaginas}
              totalRegistros={data.totalRegistros}
              tamanoPagina={data.tamanoPagina}
              onPageChange={setPagina}
              onPageSizeChange={(nuevo: number) => {
                setTamano(nuevo);
                setPagina(1);
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
