/**
 * Badge reutilizable que muestra el estado de sincronización de una geofence
 */

import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui';
import { SyncStatus } from '../types';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  className?: string;
}

const STATUS_CONFIG: Record<SyncStatus, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; labelKey: string }> = {
  [SyncStatus.PendingCreate]: { variant: 'warning', labelKey: 'geofences.sync.pendingCreate' },
  [SyncStatus.Synced]: { variant: 'success', labelKey: 'geofences.sync.synced' },
  [SyncStatus.Dirty]: { variant: 'warning', labelKey: 'geofences.sync.dirty' },
  [SyncStatus.Error]: { variant: 'error', labelKey: 'geofences.sync.error' },
  [SyncStatus.Stale]: { variant: 'info', labelKey: 'geofences.sync.stale' },
  [SyncStatus.Deleting]: { variant: 'default', labelKey: 'geofences.sync.deleting' },
};

export function SyncStatusBadge({ status, className }: SyncStatusBadgeProps) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[SyncStatus.PendingCreate];

  return (
    <Badge variant={config.variant} size="sm" className={className}>
      {t(config.labelKey)}
    </Badge>
  );
}
