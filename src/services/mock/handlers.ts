/**
 * Mock handlers para simular respuestas del backend
 */

import { env } from '@/config/env';
import { 
  mockUsers, 
  mockVehicles, 
  mockDevices, 
  mockEvents, 
  mockDashboardKPIs, 
  mockRecentActivity,
  mockOrganizationUsers 
} from './data';
import { AuthUser } from '@/shared/types';

// Simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface MockResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

function success<T>(data: T): MockResponse<T> {
  return { data, status: 200, ok: true };
}

function error(message: string, status = 400): MockResponse<{ message: string }> {
  return { data: { message }, status, ok: false };
}

/**
 * Mock handlers organizados por feature
 */
export const mockHandlers = {
  // Auth
  async login(email: string, password: string, organizationId: string): Promise<MockResponse<{ token: string; user: AuthUser } | { message: string }>> {
    await delay(800);
    
    const orgUsers = mockUsers[organizationId];
    if (!orgUsers) {
      return error('Organización no encontrada', 404);
    }

    const found = orgUsers.find(u => u.user.email === email && u.password === password);
    if (!found) {
      return error('Credenciales inválidas', 401);
    }

    return success({
      token: `mock-token-${Date.now()}`,
      user: found.user,
    });
  },

  // Dashboard
  async getDashboardKPIs(): Promise<MockResponse<typeof mockDashboardKPIs>> {
    await delay(500);
    return success(mockDashboardKPIs);
  },

  async getRecentActivity(): Promise<MockResponse<typeof mockRecentActivity>> {
    await delay(400);
    return success(mockRecentActivity);
  },

  // Vehicles
  async getVehicles(): Promise<MockResponse<typeof mockVehicles>> {
    await delay(600);
    return success(mockVehicles);
  },

  async getVehicleById(id: string) {
    await delay(300);
    const vehicle = mockVehicles.find(v => v.id === id);
    if (!vehicle) return error('Vehículo no encontrado', 404);
    return success(vehicle);
  },

  // Devices
  async getDevices(): Promise<MockResponse<typeof mockDevices>> {
    await delay(500);
    return success(mockDevices);
  },

  async assignDevice(deviceId: string, vehicleId: string) {
    await delay(700);
    const device = mockDevices.find(d => d.id === deviceId);
    if (!device) return error('Dispositivo no encontrado', 404);
    
    // En modo mock solo retornamos éxito
    return success({ message: 'Dispositivo asignado correctamente' });
  },

  async unassignDevice(deviceId: string) {
    await delay(700);
    return success({ message: 'Dispositivo desasignado correctamente' });
  },

  // Events
  async getEvents(): Promise<MockResponse<typeof mockEvents>> {
    await delay(500);
    return success(mockEvents);
  },

  async resolveEvent(eventId: string) {
    await delay(600);
    const event = mockEvents.find(e => e.id === eventId);
    if (!event) return error('Evento no encontrado', 404);
    return success({ message: 'Evento resuelto correctamente' });
  },

  // Users
  async getUsers(): Promise<MockResponse<typeof mockOrganizationUsers>> {
    await delay(500);
    return success(mockOrganizationUsers);
  },

  async createUser(userData: { nombre: string; email: string; rol: string }) {
    await delay(800);
    return success({
      id: `user-${Date.now()}`,
      ...userData,
      estado: 'activo',
      ultimoAcceso: null,
    });
  },
};

/**
 * Helper para usar mocks si está habilitado
 */
export function shouldUseMocks(): boolean {
  return env.useMocks;
}
