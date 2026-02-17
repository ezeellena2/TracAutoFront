import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
}

export function NotificationBell({ unreadCount, onClick, connectionState }: NotificationBellProps) {
  const { t } = useTranslation();
  const showDot = connectionState !== 'connected';
  const dotColor = connectionState === 'reconnecting' || connectionState === 'connecting'
    ? 'bg-warning'
    : 'bg-error';

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative p-2 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
      aria-label={t('notifications.bellAriaLabel', { count: unreadCount })}
    >
      <Bell size={20} />
      {showDot && (
        <span className={`absolute right-1 top-1 w-2 h-2 rounded-full ${dotColor}`} />
      )}
      {unreadCount > 0 && (
        <span
          aria-live="polite"
          className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-error text-white text-[10px] font-semibold flex items-center justify-center"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
