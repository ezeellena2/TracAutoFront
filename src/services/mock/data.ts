/**
 * Datos mockeados para el modo demo
 */

import { AuthUser } from '@/shared/types';

// Usuarios demo por organización
export const mockUsers: Record<string, { password: string; user: AuthUser }[]> = {
  'org-segurostech': [
    {
      password: 'admin123',
      user: {
        id: 'user-1',
        nombre: 'Carlos Administrador',
        email: 'admin@segurostech.com',
        rol: 'Admin',
        organizationId: 'org-segurostech',
        organizationName: 'SegurosTech',
      },
    },
    {
      password: 'oper123',
      user: {
        id: 'user-2',
        nombre: 'María Operadora',
        email: 'operador@segurostech.com',
        rol: 'Operador',
        organizationId: 'org-segurostech',
        organizationName: 'SegurosTech',
      },
    },
    {
      password: 'anal123',
      user: {
        id: 'user-3',
        nombre: 'Juan Analista',
        email: 'analista@segurostech.com',
        rol: 'Analista',
        organizationId: 'org-segurostech',
        organizationName: 'SegurosTech',
      },
    },
  ],
  'org-autoprotect': [
    {
      password: 'admin123',
      user: {
        id: 'user-4',
        nombre: 'Ana Administradora',
        email: 'admin@autoprotect.com',
        rol: 'Admin',
        organizationId: 'org-autoprotect',
        organizationName: 'AutoProtect',
      },
    },
  ],
  'org-driveshield': [
    {
      password: 'admin123',
      user: {
        id: 'user-5',
        nombre: 'Pedro Administrador',
        email: 'admin@driveshield.com',
        rol: 'Admin',
        organizationId: 'org-driveshield',
        organizationName: 'DriveShield',
      },
    },
  ],
};

// Vehículos demo
export const mockVehicles = [
  { id: 'v-1', patente: 'ABC123', marca: 'Toyota', modelo: 'Corolla', anio: 2022, estado: 'activo', deviceId: 'd-1', ultimaUbicacion: 'Buenos Aires', ultimaConexion: '2024-12-13T10:30:00Z' },
  { id: 'v-2', patente: 'XYZ789', marca: 'Ford', modelo: 'Ranger', anio: 2021, estado: 'activo', deviceId: 'd-2', ultimaUbicacion: 'Córdoba', ultimaConexion: '2024-12-13T10:25:00Z' },
  { id: 'v-3', patente: 'DEF456', marca: 'Chevrolet', modelo: 'Onix', anio: 2023, estado: 'inactivo', deviceId: null, ultimaUbicacion: 'Rosario', ultimaConexion: '2024-12-10T08:00:00Z' },
  { id: 'v-4', patente: 'GHI321', marca: 'Volkswagen', modelo: 'Amarok', anio: 2022, estado: 'activo', deviceId: 'd-3', ultimaUbicacion: 'Mendoza', ultimaConexion: '2024-12-13T09:45:00Z' },
  { id: 'v-5', patente: 'JKL654', marca: 'Fiat', modelo: 'Cronos', anio: 2024, estado: 'activo', deviceId: 'd-4', ultimaUbicacion: 'La Plata', ultimaConexion: '2024-12-13T10:28:00Z' },
];

// Dispositivos demo
export const mockDevices = [
  { id: 'd-1', modelo: 'FMC003', tipo: 'GPS+OBD2', imei: '351234567890123', estado: 'online', vehicleId: 'v-1', ultimoPing: '2024-12-13T10:30:00Z', firmware: '03.27.15' },
  { id: 'd-2', modelo: 'FMC003', tipo: 'GPS+OBD2', imei: '351234567890124', estado: 'online', vehicleId: 'v-2', ultimoPing: '2024-12-13T10:25:00Z', firmware: '03.27.15' },
  { id: 'd-3', modelo: 'FMB920', tipo: 'GPS', imei: '351234567890125', estado: 'offline', vehicleId: 'v-4', ultimoPing: '2024-12-12T23:45:00Z', firmware: '03.30.02' },
  { id: 'd-4', modelo: 'FMC003', tipo: 'GPS+OBD2', imei: '351234567890126', estado: 'online', vehicleId: 'v-5', ultimoPing: '2024-12-13T10:28:00Z', firmware: '03.27.15' },
  { id: 'd-5', modelo: 'FMB920', tipo: 'GPS', imei: '351234567890127', estado: 'disponible', vehicleId: null, ultimoPing: null, firmware: '03.30.02' },
];

// Eventos demo
export const mockEvents = [
  { id: 'e-1', tipo: 'exceso_velocidad', vehicleId: 'v-1', patente: 'ABC123', descripcion: 'Velocidad: 145 km/h en zona de 110 km/h', severidad: 'warning', estado: 'open', fecha: '2024-12-13T10:15:00Z', ubicacion: 'Autopista 25 de Mayo' },
  { id: 'e-2', tipo: 'geofence', vehicleId: 'v-2', patente: 'XYZ789', descripcion: 'Salida de zona autorizada: Córdoba Capital', severidad: 'info', estado: 'resolved', fecha: '2024-12-13T09:30:00Z', ubicacion: 'Córdoba' },
  { id: 'e-3', tipo: 'dtc_critico', vehicleId: 'v-4', patente: 'GHI321', descripcion: 'Código DTC P0300: Fallo de encendido aleatorio detectado', severidad: 'error', estado: 'in_progress', fecha: '2024-12-13T08:45:00Z', ubicacion: 'Mendoza' },
  { id: 'e-4', tipo: 'choque', vehicleId: 'v-5', patente: 'JKL654', descripcion: 'Impacto detectado - Acelerómetro: 4.2G', severidad: 'error', estado: 'open', fecha: '2024-12-13T07:20:00Z', ubicacion: 'La Plata' },
  { id: 'e-5', tipo: 'robo', vehicleId: 'v-1', patente: 'ABC123', descripcion: 'Movimiento sin ignición autorizada', severidad: 'error', estado: 'resolved', fecha: '2024-12-12T23:15:00Z', ubicacion: 'Buenos Aires' },
];

// KPIs demo
export const mockDashboardKPIs = {
  vehiculosActivos: 4,
  vehiculosTotal: 5,
  eventosHoy: 5,
  eventosAbiertos: 2,
  asistenciasAbiertas: 1,
  tasaConexion: 80,
};

// Actividad reciente demo
export const mockRecentActivity = [
  { id: 'a-1', tipo: 'evento', descripcion: 'Nuevo evento de exceso de velocidad', vehiculo: 'ABC123', fecha: '2024-12-13T10:15:00Z' },
  { id: 'a-2', tipo: 'dispositivo', descripcion: 'Dispositivo FMB920 desconectado', vehiculo: 'GHI321', fecha: '2024-12-12T23:45:00Z' },
  { id: 'a-3', tipo: 'asistencia', descripcion: 'Nueva asistencia creada', vehiculo: 'JKL654', fecha: '2024-12-13T07:22:00Z' },
  { id: 'a-4', tipo: 'usuario', descripcion: 'Usuario María Operadora inició sesión', vehiculo: null, fecha: '2024-12-13T08:00:00Z' },
  { id: 'a-5', tipo: 'evento', descripcion: 'Evento de geofence resuelto', vehiculo: 'XYZ789', fecha: '2024-12-13T09:35:00Z' },
];

// Usuarios de la organización (para gestión)
export const mockOrganizationUsers = [
  { id: 'user-1', nombre: 'Carlos Administrador', email: 'admin@segurostech.com', rol: 'Admin', estado: 'activo', ultimoAcceso: '2024-12-13T10:00:00Z' },
  { id: 'user-2', nombre: 'María Operadora', email: 'operador@segurostech.com', rol: 'Operador', estado: 'activo', ultimoAcceso: '2024-12-13T08:00:00Z' },
  { id: 'user-3', nombre: 'Juan Analista', email: 'analista@segurostech.com', rol: 'Analista', estado: 'activo', ultimoAcceso: '2024-12-12T18:30:00Z' },
  { id: 'user-6', nombre: 'Laura Supervisora', email: 'supervisor@segurostech.com', rol: 'Operador', estado: 'inactivo', ultimoAcceso: '2024-12-01T12:00:00Z' },
];
