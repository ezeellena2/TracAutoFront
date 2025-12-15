import { Modal, Button } from '@/shared/ui';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${
            variant === 'danger' ? 'bg-red-100 text-red-600' : 
            variant === 'warning' ? 'bg-amber-100 text-amber-600' : 
            'bg-blue-100 text-blue-600'
          }`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-text-muted">{description}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
