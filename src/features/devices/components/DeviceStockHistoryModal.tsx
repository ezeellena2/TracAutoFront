import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { History, ArrowRight } from 'lucide-react';
import { Modal, Badge } from '@/shared/ui';
import { dispositivosApi } from '@/services/endpoints';
import { useErrorHandler, useLocalization } from '@/hooks';
import { formatDateTime } from '@/shared/utils';
import type { DispositivoDto, HistorialStockDispositivoDto } from '@/shared/types/api';
import { stockStatusLabels, stockBadgeVariants } from './DeviceQrModal';

interface DeviceStockHistoryModalProps {
  device: DispositivoDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeviceStockHistoryModal({ device, isOpen, onClose }: DeviceStockHistoryModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const { culture, timeZoneId } = useLocalization();
  const [history, setHistory] = useState<HistorialStockDispositivoDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!device || !isOpen) return;

    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const result = await dispositivosApi.getHistorialStock(device.id);
        setHistory(result);
      } catch (e) {
        handleApiError(e);
      } finally {
        setIsLoading(false);
      }
    };

    void loadHistory();
  }, [device, isOpen, handleApiError]);

  if (!device) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('devices.stock.historyTitle')}
    >
      <div className="space-y-4">
        {/* Device info */}
        <div className="p-3 bg-background rounded-lg border border-border">
          <p className="text-xs text-text-muted mb-1">{t('devices.qr.deviceName')}</p>
          <p className="text-sm font-medium text-text">{device.nombre}</p>
        </div>

        {/* History list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <History size={40} className="text-text-muted mb-3" />
            <p className="text-sm text-text-muted">{t('devices.stock.historyEmpty')}</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-surface rounded-lg border border-border space-y-2"
              >
                {/* State transition */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={stockBadgeVariants[entry.estadoAnterior]}>
                    {t(stockStatusLabels[entry.estadoAnterior])}
                  </Badge>
                  <ArrowRight size={14} className="text-text-muted shrink-0" />
                  <Badge variant={stockBadgeVariants[entry.estadoNuevo]}>
                    {t(stockStatusLabels[entry.estadoNuevo])}
                  </Badge>
                </div>

                {/* Note */}
                {entry.nota && (
                  <p className="text-sm text-text">{entry.nota}</p>
                )}

                {/* Meta info */}
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{entry.usuarioNombre ?? entry.usuarioId}</span>
                  <span>{formatDateTime(entry.fechaMovimiento, culture, timeZoneId)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
