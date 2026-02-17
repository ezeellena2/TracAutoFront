import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { NotificacionDto } from '@/shared/types/notifications';

export function useNotificationTranslation() {
  const { t } = useTranslation();

  const resolveNotificationText = useCallback((notification: NotificacionDto) => {
    const templateKey = notification.templateKey;
    const params = (notification.params ?? {}) as Record<string, unknown>;

    const titleKey = templateKey ? `${templateKey}.title` : '';
    const messageKey = templateKey ? `${templateKey}.message` : '';

    const hasTitleTranslation = titleKey ? t(titleKey) !== titleKey : false;
    const hasMessageTranslation = messageKey ? t(messageKey) !== messageKey : false;

    return {
      title: hasTitleTranslation ? t(titleKey, params) : notification.titulo,
      message: hasMessageTranslation ? t(messageKey, params) : notification.mensaje,
    };
  }, [t]);

  return { resolveNotificationText };
}
