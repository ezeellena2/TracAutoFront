import { http, HttpResponse } from 'msw'

// publicApiClient baseURL: ${apiBaseUrl}/public/${apiVersion}
// Default: http://localhost:5200/api/public/v1
// alquilerPublicoApi routes: alquiler/{path}
const API_PUBLIC = 'http://localhost:5200/api/public/v1'

/**
 * MSW handlers for alquiler-publico endpoints.
 * Paths match alquilerPublicoApi calls via publicApiClient.
 */
export const handlers = [
  // GET sucursales públicas
  http.get(`${API_PUBLIC}/alquiler/sucursales`, () => {
    return HttpResponse.json([
      {
        id: 'suc-001',
        nombre: 'Casa Central',
        direccion: 'Av. Córdoba 1234',
        ciudad: 'Buenos Aires',
        provincia: 'CABA',
        permiteOneWay: false,
      },
      {
        id: 'suc-002',
        nombre: 'Sucursal Aeropuerto',
        direccion: 'Autopista Riccheri km 33.5',
        ciudad: 'Ezeiza',
        provincia: 'Buenos Aires',
        permiteOneWay: true,
      },
    ])
  }),

  // GET categorías públicas
  http.get(`${API_PUBLIC}/alquiler/categorias`, () => {
    return HttpResponse.json([
      { categoriaAlquiler: 1, nombre: 'Económico', cantidad: 3 },
      { categoriaAlquiler: 5, nombre: 'SUV', cantidad: 2 },
    ])
  }),

  // GET vehículos disponibles
  http.get(`${API_PUBLIC}/alquiler/vehiculos/disponibles`, () => {
    return HttpResponse.json([
      {
        id: 'veh-001',
        marca: 'Toyota',
        modelo: 'Corolla',
        anio: 2024,
        categoriaAlquiler: 1,
        categoriaAlquilerNombre: 'Económico',
        precioBaseDiario: 25000,
        transmision: 'Manual',
        cantidadPasajeros: 5,
        cantidadPuertas: 4,
        capacidadEquipaje: '1 valija grande',
        imagenPrincipalUrl: null,
      },
      {
        id: 'veh-002',
        marca: 'Ford',
        modelo: 'Ecosport',
        anio: 2024,
        categoriaAlquiler: 5,
        categoriaAlquilerNombre: 'SUV',
        precioBaseDiario: 45000,
        transmision: 'Automática',
        cantidadPasajeros: 5,
        cantidadPuertas: 5,
        capacidadEquipaje: '3 valijas grandes',
        imagenPrincipalUrl: null,
      },
    ])
  }),

  // GET vehículo por ID
  http.get(`${API_PUBLIC}/alquiler/vehiculos/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2024,
      categoriaAlquiler: 1,
      categoriaAlquilerNombre: 'Económico',
      precioBaseDiario: 25000,
      transmision: 'Manual',
      cantidadPasajeros: 5,
      cantidadPuertas: 4,
      capacidadEquipaje: '1 valija grande',
      imagenPrincipalUrl: null,
      depositoMinimo: 50000,
      kilometrajeLimiteDiario: 300,
      precioPorKmExcedente: 150,
      politicaCombustible: 'FullFull',
    })
  }),

  // POST cotización
  http.post(`${API_PUBLIC}/alquiler/cotizar`, () => {
    return HttpResponse.json({
      dias: 3,
      precioBaseDiario: 25000,
      subtotalBase: 75000,
      totalRecargos: 3000,
      totalCoberturas: 15000,
      descuentoPromocion: 0,
      totalFinal: 93000,
      depositoRequerido: 50000,
      moneda: 'ARS',
      detalleRecargos: [],
      detalleCoberturas: [],
    })
  }),

  // GET opciones (recargos + coberturas)
  http.get(`${API_PUBLIC}/alquiler/opciones`, () => {
    return HttpResponse.json({
      recargos: [
        { id: 'rec-001', nombre: 'GPS', precioPorDia: 3000, obligatorio: false },
        { id: 'rec-002', nombre: 'Silla Bebé', precioPorDia: 2500, obligatorio: false },
      ],
      coberturas: [
        { id: 'cob-001', nombre: 'CDW - Colisión', precioPorDia: 5000, obligatoria: false },
        { id: 'cob-002', nombre: 'PAI', precioPorDia: 3000, obligatoria: false },
      ],
    })
  }),

  // GET branding
  http.get(`${API_PUBLIC}/alquiler/branding`, () => {
    return HttpResponse.json({
      nombreOrganizacion: 'TracAuto Demo',
      logoUrl: null,
      colorPrimario: '#2563eb',
      colorSecundario: '#1e40af',
    })
  }),

  // POST validar promoción
  http.post(`${API_PUBLIC}/alquiler/promocion/validar`, () => {
    return HttpResponse.json({
      codigo: 'BIENVENIDO',
      tipoDescuento: 1,
      valorDescuento: 15,
      descripcion: 'Descuento de bienvenida 15%',
    })
  }),

  // POST crear reserva
  http.post(`${API_PUBLIC}/alquiler/reservas`, () => {
    return HttpResponse.json(
      {
        id: 'res-001',
        numeroReserva: 'RES-20260305-001',
        estado: 'Tentativa',
        fechaRetiro: '2026-03-10T10:00:00Z',
        fechaDevolucion: '2026-03-13T10:00:00Z',
        totalFinal: 93000,
      },
      { status: 201 }
    )
  }),

  // GET mis reservas (autenticado cliente)
  http.get(`${API_PUBLIC}/alquiler/mis-reservas`, () => {
    return HttpResponse.json([
      {
        id: 'res-001',
        numeroReserva: 'RES-20260305-001',
        estado: 'Confirmada',
        fechaRetiro: '2026-03-10T10:00:00Z',
        fechaDevolucion: '2026-03-13T10:00:00Z',
        totalFinal: 93000,
        vehiculoDescripcion: 'Toyota Corolla 2024',
      },
    ])
  }),

  // GET detalle de mi reserva
  http.get(`${API_PUBLIC}/alquiler/mis-reservas/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      numeroReserva: 'RES-20260305-001',
      estado: 'Confirmada',
      fechaRetiro: '2026-03-10T10:00:00Z',
      fechaDevolucion: '2026-03-13T10:00:00Z',
      totalFinal: 93000,
      vehiculoDescripcion: 'Toyota Corolla 2024',
      sucursalRetiro: 'Casa Central',
      sucursalDevolucion: 'Casa Central',
    })
  }),

  // POST cancelar mi reserva
  http.post(`${API_PUBLIC}/alquiler/mis-reservas/:id/cancelar`, () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
