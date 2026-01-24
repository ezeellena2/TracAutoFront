import { useState, useCallback, DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { validateExcelFile, formatFileSize } from '../utils/fileUtils';

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

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    const validationError = validateExcelFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    try {
      await onImport(selectedFile);
      handleClose();
    } catch (err: any) {
      setError(err?.message || t('imports.uploadError', { defaultValue: 'Error al subir el archivo' }));
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title || t('imports.selectFile', { defaultValue: 'Seleccionar archivo Excel' })}
      size="lg"
    >
      <div className="space-y-4">
        {/* File Input Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
              >
                <X size={16} className="mr-2" />
                {t('imports.removeFile', { defaultValue: 'Remover archivo' })}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload size={48} className="mx-auto text-text-muted" />
              <div>
                <p className="text-text font-medium mb-2">
                  {t('imports.dragAndDrop', {
                    defaultValue: 'Arrastra y suelta un archivo Excel aquí',
                  })}
                </p>
                <p className="text-sm text-text-muted mb-4">
                  {t('imports.orClickToSelect', { defaultValue: 'o haz clic para seleccionar' })}
                </p>
                <label className="inline-block">
                  <Button variant="primary" type="button" as="span" disabled={isUploading}>
                    {t('imports.selectFile', { defaultValue: 'Seleccionar archivo' })}
                  </Button>
                  <input
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Download Template Button */}
        {onDownloadTemplate && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={onDownloadTemplate}
              disabled={isUploading}
              className="mt-4"
            >
              <FileSpreadsheet size={16} className="mr-2" />
              {templateLabel || t('imports.downloadTemplate', { defaultValue: 'Descargar plantilla' })}
            </Button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 text-error">
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="ghost" onClick={handleClose} disabled={isUploading}>
            {t('common.cancel', { defaultValue: 'Cancelar' })}
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {t('imports.uploading', { defaultValue: 'Subiendo...' })}
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                {t('imports.import', { defaultValue: 'Importar' })}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
