import { VehiclePosition } from '../../features/traccar-map/types';

/**
 * Mock vehicle data - 10 vehicles around Buenos Aires area
 */
const MOCK_VEHICLES: VehiclePosition[] = [
  {
    id: '1',
    nombre: 'Camión Logística 01',
    patente: 'AB123CD',
    latitud: -34.6037,
    longitud: -58.3816,
    lastUpdate: new Date('2025-12-21T16:30:00'),
    velocidad: 45,
    estado: 'online',
  },
  {
    id: '2',
    nombre: 'Furgoneta Reparto 02',
    patente: 'EF456GH',
    latitud: -34.5875,
    longitud: -58.4073,
    lastUpdate: new Date('2025-12-21T16:28:00'),
    velocidad: 32,
    estado: 'online',
  },
  {
    id: '3',
    nombre: 'Camioneta Ventas 03',
    patente: 'IJ789KL',
    latitud: -34.6158,
    longitud: -58.4333,
    lastUpdate: new Date('2025-12-21T16:25:00'),
    velocidad: 0,
    estado: 'offline',
  },
  {
    id: '4',
    nombre: 'Móvil Técnico 04',
    patente: 'MN012OP',
    latitud: -34.5711,
    longitud: -58.4232,
    lastUpdate: new Date('2025-12-21T16:32:00'),
    velocidad: 58,
    estado: 'online',
  },
  {
    id: '5',
    nombre: 'Camión Carga 05',
    patente: 'QR345ST',
    latitud: -34.6346,
    longitud: -58.3654,
    lastUpdate: new Date('2025-12-21T16:20:00'),
    velocidad: 0,
    estado: 'unknown',
  },
  {
    id: '6',
    nombre: 'Van Express 06',
    patente: 'UV678WX',
    latitud: -34.5927,
    longitud: -58.3921,
    lastUpdate: new Date('2025-12-21T16:31:00'),
    velocidad: 42,
    estado: 'online',
  },
  {
    id: '7',
    nombre: 'Pickup Servicio 07',
    patente: 'YZ901AB',
    latitud: -34.6082,
    longitud: -58.4456,
    lastUpdate: new Date('2025-12-21T16:29:00'),
    velocidad: 28,
    estado: 'online',
  },
  {
    id: '8',
    nombre: 'Flota Norte 08',
    patente: 'CD234EF',
    latitud: -34.5623,
    longitud: -58.4567,
    lastUpdate: new Date('2025-12-21T16:15:00'),
    velocidad: 0,
    estado: 'offline',
  },
  {
    id: '9',
    nombre: 'Transporte Sur 09',
    patente: 'GH567IJ',
    latitud: -34.6501,
    longitud: -58.3789,
    lastUpdate: new Date('2025-12-21T16:27:00'),
    velocidad: 55,
    estado: 'online',
  },
  {
    id: '10',
    nombre: 'Utilitario Central 10',
    patente: 'KL890MN',
    latitud: -34.6189,
    longitud: -58.3567,
    lastUpdate: new Date('2025-12-21T16:33:00'),
    velocidad: 38,
    estado: 'online',
  },
];

/**
 * Simulates fetching vehicle positions from Traccar backend
 * @returns Promise with array of vehicle positions
 */
export async function getVehiclePositions(): Promise<VehiclePosition[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Return mock data
  return MOCK_VEHICLES;
}
