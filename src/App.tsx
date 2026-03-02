/**
 * Re-export de B2BApp para backward compatibility.
 * El punto de entrada principal ahora es src/main.tsx que detecta
 * el appMode y carga la app correcta via lazy import.
 */
export { B2BApp as App, B2BApp as default } from '@/apps/b2b/B2BApp';
