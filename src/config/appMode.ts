/**
 * Detección del modo de aplicación.
 * Actualmente solo soporta el modo B2B.
 */

export type AppMode = 'b2b';

export function detectAppMode(): AppMode {
  return 'b2b';
}
