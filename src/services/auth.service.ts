/**
 * Servicio de autenticación
 * Maneja login, logout, y gestión de sesión
 */

import { authApi } from '@/services/endpoints';
import { useAuthStore, useTenantStore, useThemeStore } from '@/store';
import { AuthUser } from '@/shared/types';
import { OrganizationTheme } from '@/shared/types/organization';

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Realiza login con email y password
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const { token, user } = await authApi.login(email, password);
    
    // Guardar en auth store
    useAuthStore.getState().login(user, token);
    
    return {
      success: true,
      user,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de autenticación';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Realiza login con email, password y organización seleccionada
 */
export async function loginWithOrganization(
  email: string, 
  password: string, 
  organization: OrganizationTheme
): Promise<LoginResult> {
  try {
    const { token, user } = await authApi.loginTradicional(email, password, organization.id);
    
    // Guardar en auth store
    useAuthStore.getState().login(user, token);
    
    // Guardar organización y tema
    useTenantStore.getState().setOrganization(organization);
    useThemeStore.getState().setTheme(organization.theme);
    
    return {
      success: true,
      user,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de autenticación';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Cierra la sesión del usuario
 */
export function logout(): void {
  // Limpiar auth store
  useAuthStore.getState().logout();
  
  // Limpiar tenant store
  useTenantStore.getState().clearOrganization();
  
  // Opcional: resetear tema a valores por defecto
  // useThemeStore.getState().resetTheme();
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated;
}

/**
 * Obtiene el token JWT actual
 */
export function getToken(): string | null {
  return useAuthStore.getState().token;
}

/**
 * Obtiene el usuario actual
 */
export function getCurrentUser(): AuthUser | null {
  return useAuthStore.getState().user;
}

/**
 * Obtiene la organización actual
 */
export function getCurrentOrganization(): OrganizationTheme | null {
  return useTenantStore.getState().currentOrganization;
}

export const authService = {
  login,
  loginWithOrganization,
  logout,
  isAuthenticated,
  getToken,
  getCurrentUser,
  getCurrentOrganization,
};

export default authService;
