import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, Download, FileText, Copy, Check } from 'lucide-react';
import { Modal, Button, Badge } from '@/shared/ui';
import { dispositivosApi } from '@/services/endpoints';
import { useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import { downloadBlob } from '@/shared/utils/fileUtils';
import type { DispositivoDto } from '@/shared/types/api';
import { stockStatusLabels, stockBadgeVariants } from '../utils/stockStatus';

interface DeviceQrModalProps {
  device: DispositivoDto | null;
  isOpen: boolean;
  onClose: () => void;
}


export function DeviceQrModal({ device, isOpen, onClose }: DeviceQrModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!device) return null;

  const publicUrl = `${window.location.origin}/d/${device.codigoQr}`;

  const handleDownloadPng = async () => {
    setIsDownloadingPng(true);
    try {
      const blob = await dispositivosApi.downloadQrImage(device.id);
      downloadBlob(blob, `qr-${device.nombre || device.uniqueId || device.id}.png`);
      toast.success(t('devices.qr.downloadSuccess'));
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const blob = await dispositivosApi.downloadEtiquetaQrPdf(device.id);
      downloadBlob(blob, `etiqueta-qr-${device.nombre || device.uniqueId || device.id}.pdf`);
      toast.success(t('devices.qr.downloadPdfSuccess'));
    } catch (e) {
      handleApiError(e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('devices.qr.copySuccess'));
    } catch {
      toast.error(t('devices.qr.copyError'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('devices.qr.title')}
    >
      <div className="space-y-6">
        {/* Device info summary */}
        <div className="p-4 bg-background rounded-lg border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">{t('devices.qr.deviceName')}</span>
            <span className="text-sm font-medium text-text">{device.nombre}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">IMEI</span>
            <span className="text-sm font-mono text-text">{device.uniqueId || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">{t('devices.stock.statusLabel')}</span>
            <Badge variant={stockBadgeVariants[device.estadoStock]}>
              {t(stockStatusLabels[device.estadoStock])}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">{t('devices.qr.code')}</span>
            <span className="text-sm font-mono font-bold text-primary">{device.codigoQr}</span>
          </div>
        </div>

        {/* QR code preview area */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-48 h-48 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-white">
            <QrCode size={120} className="text-text-muted" />
          </div>
          <p className="text-xs text-text-muted text-center">
            {t('devices.qr.previewHint')}
          </p>
        </div>

        {/* Public URL */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className="flex-1 px-3 py-2 text-sm font-mono bg-background border border-border rounded-lg text-text-muted"
          />
          <Button variant="outline" size="sm" onClick={handleCopyUrl}>
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          </Button>
        </div>

        {/* Download buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadPng}
            isLoading={isDownloadingPng}
            disabled={isDownloadingPng || isDownloadingPdf}
          >
            <Download size={16} className="mr-2" />
            {t('devices.qr.downloadPng')}
          </Button>
          <Button
            className="flex-1"
            onClick={handleDownloadPdf}
            isLoading={isDownloadingPdf}
            disabled={isDownloadingPng || isDownloadingPdf}
          >
            <FileText size={16} className="mr-2" />
            {t('devices.qr.downloadPdf')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export { stockStatusLabels, stockBadgeVariants };
