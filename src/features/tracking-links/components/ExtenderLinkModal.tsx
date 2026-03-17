import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '@/shared/ui';
import type { ExtenderLinkTrackingRequest } from '../types';

interface ExtenderLinkModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (request: ExtenderLinkTrackingRequest) => void;
}

export function ExtenderLinkModal({ isOpen, isLoading, onClose, onSubmit }: ExtenderLinkModalProps) {
  const { t } = useTranslation();
  const [minutosAdicionales, setMinutosAdicionales] = useState('60');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minutos = parseInt(minutosAdicionales, 10);
    if (minutos > 0) {
      onSubmit({ minutosAdicionales: minutos });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('trackingLinks.extenderTitulo')} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1">{t('trackingLinks.minutosAdicionales')}</label>
          <input
            type="number"
            value={minutosAdicionales}
            onChange={(e) => setMinutosAdicionales(e.target.value)}
            placeholder={t('trackingLinks.minutosAdicionalesPlaceholder')}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            min={15}
            max={43200}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : t('trackingLinks.extender')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
