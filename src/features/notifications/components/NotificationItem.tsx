import { AlertCircle, Archive, Bell, CheckCircle2, ShieldAlert, TriangleAlert, CarFront } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CategoriaNotificacion, NotificacionDto, TipoNotificacion } from '@/shared/types/notifications';
import { useTranslation } from 'react-i18next';
import { useNotificationTranslation } from '../hooks/useNotificationTranslation';

interface NotificationItemProps {
  item: NotificacionDto;
  onMarkAsRead: (id: string) => void;
  onArchivar: (id: string) => void;
  onCloseDrawer?: () => void;
}

function getRelativeTime(isoDate: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const now = Date.now();
  const date = new Date(isoDate).getTime();
  const diffMs = Math.max(0, now - date);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t('notifications.time.now');
  if (minutes < 60) return t('notifications.time.minutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('notifications.time.hours', { count: hours });
  const days = Math.floor(hours / 24);
  return t('notifications.time.days', { count: days });
}

function getIcon(tipo: TipoNotificacion, categoria: CategoriaNotificacion) {
  if (categoria === 'Vehiculo') return CarFront;
  switch (tipo) {
    case 'Success':
      return CheckCircle2;
    case 'Warning':
      return TriangleAlert;
    case 'Error':
      return AlertCircle;
    case 'SystemAlert':
      return ShieldAlert;
    default:
      return Bell;
  }
}

export function NotificationItem({
  item,
  onMarkAsRead,
  onArchivar,
  onCloseDrawer,
}: NotificationItemProps) {
  const { t } = useTranslation();
  const { resolveNotificationText } = useNotificationTranslation();
  const navigate = useNavigate();
  const Icon = getIcon(item.tipo, item.categoria);
  const text = resolveNotificationText(item);

  const handleClick = () => {
    if (!item.leida) {
      onMarkAsRead(item.id);
    }
    if (item.linkAccion) {
      navigate(item.linkAccion);
      onCloseDrawer?.();
    }
  };

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${item.leida ? 'border-border bg-surface' : 'border-primary/40 bg-primary/5'}`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <Icon size={16} className={item.leida ? 'text-text-muted' : 'text-primary'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm truncate ${item.leida ? 'text-text' : 'text-text font-semibold'}`}>
              {text.title}
            </p>
            {!item.leida && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
          </div>
          <p className="text-xs text-text-muted mt-1 line-clamp-2">{text.message}</p>
          <p className="text-[11px] text-text-muted mt-2">
            {getRelativeTime(item.fechaCreacion, t)}
          </p>
        </div>
        <button
          type="button"
          className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            onArchivar(item.id);
          }}
          aria-label={t('notifications.actions.archive')}
        >
          <Archive size={14} />
        </button>
      </div>
    </div>
  );
}
