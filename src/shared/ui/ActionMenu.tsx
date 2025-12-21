import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MoreVertical } from 'lucide-react';
import { Portal } from './Portal';

interface ActionMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

const MENU_WIDTH = 160;
const MENU_ESTIMATED_HEIGHT = 200; // Estimated max height for the dropdown
const MENU_GAP = 4;

export function ActionMenu({ isOpen, onToggle, onClose, children }: ActionMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate and update menu position
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Get actual menu height if available, otherwise use estimate
    const menuHeight = menuRef.current?.offsetHeight || MENU_ESTIMATED_HEIGHT;
    
    // Calculate if there's enough space below
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let top: number;
    if (spaceBelow >= menuHeight + MENU_GAP) {
      // Enough space below - position normally
      top = rect.bottom + MENU_GAP;
    } else if (spaceAbove >= menuHeight + MENU_GAP) {
      // Not enough space below but enough above - flip upward
      top = rect.top - menuHeight - MENU_GAP;
    } else {
      // Not enough space either way - position at best available spot
      if (spaceBelow > spaceAbove) {
        top = rect.bottom + MENU_GAP;
      } else {
        top = Math.max(MENU_GAP, rect.top - menuHeight - MENU_GAP);
      }
    }
    
    // Calculate horizontal position (align to right edge of button)
    let left = rect.right - MENU_WIDTH;
    
    // Ensure it doesn't go off-screen horizontally
    if (left < MENU_GAP) {
      left = MENU_GAP;
    } else if (left + MENU_WIDTH > viewportWidth - MENU_GAP) {
      left = viewportWidth - MENU_WIDTH - MENU_GAP;
    }
    
    setPosition({ top, left });
  }, []);

  // Initial position calculation and recalculate on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    
    updatePosition();
    
    // Recalculate position on scroll/resize instead of closing
    const handleScrollOrResize = () => {
      updatePosition();
    };
    
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  // Cerrar al clickear afuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        // Chequear si el click fue dentro del menú (que está en el portal)
        const target = event.target as HTMLElement;
        if (!target.closest('.action-menu-content')) {
            onClose();
        }
      }
    };
    
    // Escuchar en captura para ganarle a otros handlers si es necesario
    document.addEventListener('click', handleClickOutside, true);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
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
            ref={menuRef}
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
