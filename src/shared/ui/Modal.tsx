import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  className?: string;
  /** Excluye este modal del detector de Modo Solicitud (evita que Enviar/input capturen el clic) */
  dataTracautoSolicitudModal?: boolean;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className = '', dataTracautoSolicitudModal }: ModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'visible';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    'full': 'max-w-[95vw]',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center min-h-[100dvh] min-w-[100vw]"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      {...(dataTracautoSolicitudModal ? { 'data-tracauto-solicitud-modal': '' } : {})}
    >
      {/* Backdrop: cubre todo el viewport sin huecos */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm min-h-[100dvh] min-w-[100vw]"
        style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full ${sizes[size]} ${className} mx-4 max-h-[90vh] overflow-y-auto bg-surface rounded-xl border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-200`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="text-lg font-semibold text-text">{title}</div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
