import { useEffect, useRef } from 'react';
import { useModoSolicitudStore } from '@/store/modoSolicitud.store';

const HIGHLIGHT_CLASS = 'tracauto-cr-key-highlight';
const DATA_CR_KEY = 'data-cr-key';

/**
 * Hook que detecta hover/click en elementos con data-cr-key cuando "Modo Solicitud" está activo.
 * Aplica highlight en hover y al hacer click guarda el contexto y abre el modal (vía store).
 */
export function useCrKeyDetection() {
  const { activo, setSelectedContext, clearSelection } = useModoSolicitudStore();
  const hoveredRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!activo || typeof document === 'undefined') return;

    function getCrKeyElement(el: EventTarget | null): HTMLElement | null {
      if (!(el instanceof HTMLElement)) return null;
      const cr = el.closest(`[${DATA_CR_KEY}]`);
      return cr instanceof HTMLElement ? cr : null;
    }

    function clearHighlight() {
      if (hoveredRef.current) {
        hoveredRef.current.classList.remove(HIGHLIGHT_CLASS);
        hoveredRef.current = null;
      }
    }

    function handleMouseOver(e: MouseEvent) {
      const cr = getCrKeyElement(e.target);
      clearHighlight();
      if (cr) {
        cr.classList.add(HIGHLIGHT_CLASS);
        hoveredRef.current = cr;
      }
    }

    function handleMouseOut() {
      clearHighlight();
    }

    function handleClick(e: MouseEvent) {
      const cr = getCrKeyElement(e.target);
      if (!cr) return;
      e.preventDefault();
      e.stopPropagation();
      const key = cr.getAttribute(DATA_CR_KEY);
      const route = cr.getAttribute('data-route') ?? '';
      const label = cr.getAttribute('data-label') ?? '';
      const entityType = cr.getAttribute('data-entity-type') ?? undefined;
      const entityIdRaw = cr.getAttribute('data-entity-id');
      const entityId = entityIdRaw && /^[0-9a-f-]{36}$/i.test(entityIdRaw) ? entityIdRaw : undefined;
      if (key) {
        setSelectedContext({ crKey: key, route, label, entityType, entityId });
      }
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
  }, [activo, setSelectedContext]);

  return { clearSelection };
}
