import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Modal } from './Modal';

interface ImportProcessingModalProps {
  isOpen: boolean;
  tipoImportacion?: string;
}

/**
 * Modal shown while an import job is being processed in the background.
 * The actual processing happens in Hangfire; this informs the user that
 * the file was received and is being processed.
 */
export function ImportProcessingModal({
  isOpen,
  tipoImportacion,
}: ImportProcessingModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title={t('imports.processing.title', {
        defaultValue: 'Procesando importación',
      })}
      size="md"
    >
      <div className="flex flex-col items-center justify-center py-8 space-y-6">
        <div className="p-4 rounded-full bg-primary/10">
          <Loader2 size={48} className="text-primary animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <p className="font-medium text-text">
            {t('imports.processing.message', {
              defaultValue: 'El archivo se está procesando en segundo plano.',
            })}
          </p>
          <p className="text-sm text-text-muted">
            {tipoImportacion
              ? t('imports.processing.subtitleWithType', {
                  defaultValue: 'Procesando {{tipo}}... Puede tardar unos segundos.',
                  tipo: tipoImportacion,
                })
              : t('imports.processing.subtitle', {
                  defaultValue: 'Puede tardar unos segundos. No cierre esta ventana.',
                })}
          </p>
        </div>
      </div>
    </Modal>
  );
}
