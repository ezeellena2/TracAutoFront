import React, { useRef, useState, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { Portal } from './Portal';

interface ActionMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export function ActionMenu({ isOpen, onToggle, onClose, children }: ActionMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      // Posicionar abajo a la izquierda del botón por defecto
      setPosition({
        top: rect.bottom + scrollY + 4,
        left: rect.right + scrollX - 160 // 160px width
      });
    }
  }, [isOpen]);

  // Cerrar al clickear afuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        // Chequear si el click fue dentro del menú (que está en el portal)
        // Como el portal está en body, necesitamos un ref al contenido del menú o usar closest
        const target = event.target as HTMLElement;
        if (!target.closest('.action-menu-content')) {
            onClose();
        }
      }
    };
    
    // Escuchar en captura para ganarle a otros handlers si es necesario
    document.addEventListener('click', handleClickOutside, true); 
    // También al scroll para cerrar (más simple que recalcular)
    window.addEventListener('scroll', onClose, true);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="p-2 hover:bg-surface rounded-lg transition-colors"
      >
        <MoreVertical size={16} className="text-text-muted" />
      </button>

      {isOpen && (
        <Portal>
          <div
            className="action-menu-content fixed bg-background border border-border rounded-lg shadow-lg py-1 z-[9999] min-w-[160px]"
            style={{
              top: position.top,
              left: position.left,
            }}
            onClick={(e) => e.stopPropagation()} // Evitar propagación desde el portal
          >
            {children}
          </div>
        </Portal>
      )}
    </>
  );
}
