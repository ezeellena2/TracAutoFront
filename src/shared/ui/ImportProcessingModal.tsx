import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';

interface ImportProcessingModalProps {
  isOpen: boolean;
  tipoImportacion?: string;
}

export function ImportProcessingModal({
  isOpen,
  tipoImportacion,
}: ImportProcessingModalProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={() => {}} title={t('imports.processing.title')} size="md">
      <div className="flex flex-col items-center justify-center space-y-6 py-8">
        <div className="rounded-full bg-primary/10 p-4">
          <Loader2 size={48} className="animate-spin text-primary" />
        </div>
        <div className="space-y-2 text-center">
          <p className="font-medium text-text">{t('imports.processing.message')}</p>
          <p className="text-sm text-text-muted">
            {tipoImportacion
              ? t('imports.processing.subtitleWithType', { type: tipoImportacion })
              : t('imports.processing.subtitle')}
          </p>
        </div>
      </div>
    </Modal>
  );
}
