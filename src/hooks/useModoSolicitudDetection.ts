import { useEffect, useRef } from 'react';
import { useModoSolicitudStore } from '@/store/modoSolicitud.store';
import type { SolicitudContext } from '@/store/modoSolicitud.store';
import {
  generateCssSelector,
  inferLabel,
  inferEntityTypeFromRoute,
  getSignificantElement,
} from '@/utils/selectorUtils';

const HIGHLIGHT_CLASS = 'tracauto-cr-key-highlight';

/**
 * Hook que detecta hover/click en cualquier elemento significativo cuando "Modo Solicitud" está activo.
 * Aplica highlight en hover y al hacer click genera contexto dinámico (selector CSS, label inferido) y abre el modal.
 */
export function useModoSolicitudDetection() {
  const { activo, setSelectedContext, clearSelection, desactivar } = useModoSolicitudStore();
  const hoveredRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!activo || typeof document === 'undefined') return;

    function buildDynamicContext(el: HTMLElement): SolicitudContext {
      return {
        selector: generateCssSelector(el),
        route: window.location.pathname,
        label: inferLabel(el),
        entityType: inferEntityTypeFromRoute(window.location.pathname),
        entityId: undefined,
        elementTag: el.tagName.toLowerCase(),
        pageTitle: document.title || undefined,
      };
    }

    function clearHighlight() {
      if (hoveredRef.current) {
        hoveredRef.current.classList.remove(HIGHLIGHT_CLASS);
        hoveredRef.current = null;
      }
    }

    function handleMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest?.('[data-tracauto-modo-solicitud-toggle]')) return;
      if (target.closest?.('[data-tracauto-solicitud-modal]')) return;
      const el = getSignificantElement(e.target);
      clearHighlight();
      if (el) {
        el.classList.add(HIGHLIGHT_CLASS);
        hoveredRef.current = el;
      }
    }

    function handleMouseOut() {
      clearHighlight();
    }

    function handleClick(e: MouseEvent) {
      // No interceptar clic en el botón "Modo Solicitud" del header: debe poder apagarse con el mismo botón
      const target = e.target as HTMLElement;
      if (target.closest?.('[data-tracauto-modo-solicitud-toggle]')) return;
      // No interceptar clics dentro del modal de solicitud (Enviar, input, X): deben ejecutar su acción normal
      if (target.closest?.('[data-tracauto-solicitud-modal]')) return;

      const el = getSignificantElement(e.target);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      clearHighlight();
      // Salir del modo solicitud antes de abrir el modal:
      // el modal se abre por selectedContext (no por activo),
      // así al cerrar el modal el usuario ya no está en modo solicitud.
      desactivar();
      setSelectedContext(buildDynamicContext(el));
    }

    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      document.removeEventListener('click', handleClick, true);
      clearHighlight();
    };
  }, [activo, setSelectedContext, desactivar]);

  return { clearSelection };
}
