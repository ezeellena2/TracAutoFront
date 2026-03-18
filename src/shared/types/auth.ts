/**
 * Tipos base para autenticación
 */

export type UserRole = 'SuperAdmin' | 'Admin' | 'Operador' | 'Analista';

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  organizationId: string;
  organizationName: string;
}
