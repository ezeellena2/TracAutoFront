/**
 * Tipos base para autenticación
 */

export type UserRole = 'SuperAdmin' | 'Admin' | 'Operador' | 'Analista';

export interface AuthContext {
  tipo: 'Personal' | 'Organizacion';
  id?: string | null;
  nombre: string;
  modulosActivos?: number[];
  capacidadesEfectivas?: string[];
}

export interface AvailableAuthContext extends AuthContext {
  organizacionId?: string | null;
  rol?: UserRole | null;
}

export interface AuthUser {
  id: string;
  personaId?: string | null;
  nombre: string;
  email: string;
  rol?: UserRole | null;
  organizationId?: string | null;
  organizationName?: string | null;
  contextoActivo: AuthContext;
  contextosDisponibles: AvailableAuthContext[];
}
