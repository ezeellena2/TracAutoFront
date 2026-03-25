import { useCallback, useRef, useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { formatFileSize, IMPORT_ERROR_KEYS, MAX_EXCEL_FILE_SIZE, validateExcelFile } from '../utils/fileUtils';
import { Button } from './Button';
import { Modal } from './Modal';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  title?: string;
  accept?: string;
  onDownloadTemplate?: () => Promise<void>;
  templateLabel?: string;
}

export function ImportExcelModal({
  isOpen,
  onClose,
  onImport,
  title,
  accept = '.xlsx',
  onDownloadTemplate,
  templateLabel,
}: ImportExcelModalProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    const code = validateExcelFile(file);

    if (code) {
      const message =
        code === IMPORT_ERROR_KEYS.fileTooLarge
          ? t(code, { max: formatFileSize(MAX_EXCEL_FILE_SIZE) })
          : t(code);
      setError(message);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }, [t]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
    event.target.value = '';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSelectClick = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      await onImport(selectedFile);
      handleClose();
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : t('imports.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setError(null);
    setIsDragging(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title || t('imports.selectFile')} size="lg">
      <div className="space-y-4">
        <div
          className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : selectedFile
                ? 'border-success bg-success/5'
                : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-2">
              <FileSpreadsheet size={48} className="mx-auto text-success" />
              <div>
                <p className="font-medium text-text">{selectedFile.name}</p>
                <p className="text-sm text-text-muted">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} disabled={isUploading}>
                <X size={16} className="mr-2" />
                {t('imports.removeFile')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload size={48} className="mx-auto text-text-muted" />
              <div>
                <p className="mb-2 font-medium text-text">{t('imports.dragAndDrop')}</p>
                <p className="mb-4 text-sm text-text-muted">{t('imports.orClickToSelect')}</p>
                <div className="inline-block">
                  <Button variant="primary" type="button" onClick={handleSelectClick} disabled={isUploading}>
                    {t('imports.selectFile')}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {onDownloadTemplate && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={onDownloadTemplate} disabled={isUploading} className="mt-4">
              <FileSpreadsheet size={16} className="mr-2" />
              {templateLabel || t('imports.downloadTemplate')}
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-error/10 p-3 text-error">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="ghost" onClick={handleClose} disabled={isUploading}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={!selectedFile || isUploading}>
            {isUploading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {t('imports.uploading')}
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                {t('imports.import')}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
