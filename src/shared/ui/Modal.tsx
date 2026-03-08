import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// ─── Sub-component interfaces ────────────────────────────────────────────────

interface ModalHeaderProps {
  /** Icono opcional que se muestra a la izquierda del título */
  icon?: React.ReactNode;
  /** Título principal del modal */
  title: React.ReactNode;
  /** Subtítulo descriptivo debajo del título (ej: patente, nombre del recurso) */
  subtitle?: React.ReactNode;
  /** Badge de contexto (ej: estado actual) que se muestra junto al subtítulo */
  badge?: React.ReactNode;
  /** Callback para cerrar el modal */
  onClose?: () => void;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ModalHeader({ icon, title, subtitle, badge, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-start justify-between px-6 py-5 border-b border-border">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mt-0.5">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-text leading-tight">{title}</h2>
          {(subtitle || badge) && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {subtitle && (
                <span className="text-sm text-text-muted">{subtitle}</span>
              )}
              {badge}
            </div>
          )}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors ml-4"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}

function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div className={`px-6 py-5 ${className}`}>
      {children}
    </div>
  );
}

function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t border-border ${className}`}>
      {children}
    </div>
  );
}

// ─── Main Modal component ────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** @deprecated Usa <Modal.Header> para un header más rico y uniforme */
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  className?: string;
  /** Excluye este modal del detector de Modo Solicitud (evita que Enviar/input capturen el clic) */
  dataTracautoSolicitudModal?: boolean;
  /** ID del elemento que etiqueta el modal para accesibilidad */
  ariaLabelledBy?: string;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className = '', dataTracautoSolicitudModal, ariaLabelledBy }: ModalProps) {
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

  // Detectar si children incluye sub-componentes (Modal.Header, Modal.Body, Modal.Footer)
  // Si usa sub-componentes, NO wrappear en un div con padding
  const hasSubComponents = React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      (child.type === ModalHeader || child.type === ModalBody || child.type === ModalFooter)
  );

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
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        className={`relative w-full ${sizes[size]} ${className} mx-4 max-h-[90vh] overflow-y-auto bg-surface rounded-xl border border-border shadow-2xl animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Legacy header — retrocompatible con title prop */}
        {title && !hasSubComponents && (
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
        {hasSubComponents ? (
          children
        ) : (
          <div className="p-6">
            {children}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// ─── Attach sub-components ───────────────────────────────────────────────────

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
