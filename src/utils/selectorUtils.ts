/**
 * Utilidades para detección dinámica de elementos en Modo Solicitud.
 * Genera selectores CSS y etiquetas sin depender de atributos manuales.
 */

const MAX_ANCESTOR_LEVELS = 10;

/** Tags que siempre son significativos (interactivos o semánticos) */
const SIGNIFICANT_TAGS = new Set([
  'button', 'a', 'input', 'select', 'textarea', 'td', 'th',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'p', 'img',
]);

/** Tags de contenedor que pueden ser significativos si tienen contenido visible */
const CONTAINER_TAGS = new Set(['div', 'section', 'main', 'article', 'aside', 'header', 'footer', 'nav']);

/** Tags a ignorar siempre */
const IGNORE_TAGS = new Set(['html', 'body', 'script', 'style', 'noscript']);

/**
 * Genera un selector CSS único para un elemento.
 * Prioridad: id > [data-testid] > [aria-label] > path por nth-child.
 */
export function generateCssSelector(el: HTMLElement): string {
  if (!el || !el.ownerDocument) return '';

  const parts: string[] = [];
  let current: HTMLElement | null = el;
  let levels = 0;

  while (current && current.nodeType === Node.ELEMENT_NODE && levels < MAX_ANCESTOR_LEVELS) {
    const tag = current.tagName.toLowerCase();
    const id = current.id;
    const testId = current.getAttribute('data-testid');
    const ariaLabel = current.getAttribute('aria-label');

    if (id && /^[a-zA-Z][\w-]*$/.test(id) && !id.includes(':')) {
      parts.unshift(`#${CSS.escape(id)}`);
      break;
    }
    if (testId) {
      parts.unshift(`${tag}[data-testid="${CSS.escape(testId)}"]`);
      break;
    }
    if (ariaLabel) {
      parts.unshift(`${tag}[aria-label="${CSS.escape(ariaLabel)}"]`);
      break;
    }

    let selector = tag;
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(Boolean);
      const stableClass = classes.find((c) => !/^(css-|Mui|_)/.test(c));
      if (stableClass) {
        selector += `.${CSS.escape(stableClass)}`;
      }
    }

    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(
        (s) => s.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${idx})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
    levels++;
  }

  return parts.join(' > ');
}

/**
 * Infiere una etiqueta descriptiva del elemento.
 * Orden: aria-label > textContent > tagName + className
 */
export function inferLabel(el: HTMLElement): string {
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel?.trim()) return ariaLabel.trim().substring(0, 80);

  const text = el.textContent?.trim();
  if (text && text.length > 0) return text.substring(0, 80);

  const tag = el.tagName.toLowerCase();
  const firstClass = el.className && typeof el.className === 'string'
    ? el.className.trim().split(/\s+/)[0]
    : '';
  if (firstClass) return `${tag}.${firstClass}`;
  return tag;
}

const ROUTE_ENTITY_MAP: Record<string, string> = {
  '/vehiculos': 'Vehiculo',
  '/conductores': 'Conductor',
  '/dispositivos': 'Dispositivo',
  '/geozonas': 'Geofence',
};

/**
 * Infiere el tipo de entidad desde la ruta actual.
 */
export function inferEntityTypeFromRoute(route: string): string | undefined {
  const normalized = route.replace(/\/$/, '') || '/';
  return ROUTE_ENTITY_MAP[normalized];
}

/**
 * Verifica si un elemento es "significativo" y debe ser seleccionable en Modo Solicitud.
 */
export function isSignificantElement(el: HTMLElement): boolean {
  if (!(el instanceof HTMLElement)) return false;

  const tag = el.tagName.toLowerCase();
  if (IGNORE_TAGS.has(tag)) return false;

  const style = window.getComputedStyle(el);
  if (style.pointerEvents === 'none' || style.visibility === 'hidden' || style.display === 'none') {
    return false;
  }

  if (SIGNIFICANT_TAGS.has(tag)) return true;

  if (CONTAINER_TAGS.has(tag)) {
    const hasDirectText = Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim().length
    );
    if (hasDirectText) return true;
    const hasInteractiveChild = el.querySelector('button, a, input, select, [role="button"]');
    if (hasInteractiveChild) return false;
    const hasVisibleChildren = el.children.length > 0 && el.offsetWidth > 0 && el.offsetHeight > 0;
    if (hasVisibleChildren) return true;
  }

  return false;
}

/**
 * Obtiene el elemento significativo más cercano al target (el mismo o un ancestro).
 */
export function getSignificantElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null;
  let current: HTMLElement | null = target;
  while (current) {
    if (isSignificantElement(current)) return current;
    if (current.tagName === 'BODY' || current.tagName === 'HTML') break;
    current = current.parentElement;
  }
  return null;
}
