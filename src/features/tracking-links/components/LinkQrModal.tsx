import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import type { LinkTrackingDto } from '../types';

interface LinkQrModalProps {
  link: LinkTrackingDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LinkQrModal({ link, isOpen, onClose }: LinkQrModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!link) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para navegadores antiguos
      const textarea = document.createElement('textarea');
      textarea.value = link.url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPng = () => {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `qr-tracking-${link.nombre || link.vehiculoPatente}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('trackingLinks.qr.titulo')} size="sm">
      <div className="space-y-5">
        {/* Informacion del link */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-text">{link.vehiculoNombre}</p>
          <p className="text-xs text-text-muted">{link.vehiculoPatente}</p>
          {link.nombre && (
            <p className="text-xs text-text-muted">{link.nombre}</p>
          )}
        </div>

        {/* QR Code */}
        <div className="flex justify-center" ref={qrRef}>
          <div className="p-4 bg-white rounded-lg">
            <QRCodeSVG
              value={link.url}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>
        </div>

        {/* URL con boton copiar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={link.url}
            className="flex-1 px-3 py-2 text-xs font-mono bg-background border border-border rounded-lg text-text-muted truncate"
          />
          <button
            onClick={handleCopyUrl}
            className="p-2 rounded-lg border border-border text-text-muted hover:text-primary hover:border-primary transition-colors flex-shrink-0"
            title={t('trackingLinks.copiarUrl')}
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>

        {/* Botones de accion */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadPng}
            className="flex-1"
          >
            <Download size={16} className="mr-2" />
            {t('trackingLinks.qr.descargarPng')}
          </Button>
          <Button
            onClick={onClose}
            className="flex-1"
          >
            {t('common.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
