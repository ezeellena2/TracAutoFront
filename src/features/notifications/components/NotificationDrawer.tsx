import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Drawer } from '@/shared/ui';
import type { NotificacionDto } from '@/shared/types/notifications';
import { NotificationItem } from './NotificationItem';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificacionDto[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onArchivar: (id: string) => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onArchivar,
}: NotificationDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const footer = (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={onMarkAllAsRead}
      >
        {t('notifications.actions.markAllAsRead')}
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          navigate('/notificaciones');
          onClose();
        }}
      >
        {t('notifications.actions.viewAll')}
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('notifications.title')}
      width="md"
      footer={footer}
    >
      {notifications.length === 0 ? (
        <p className="text-sm text-text-muted">{t('notifications.empty')}</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onMarkAsRead={onMarkAsRead}
              onArchivar={onArchivar}
              onCloseDrawer={onClose}
            />
          ))}
        </div>
      )}
    </Drawer>
  );
}
