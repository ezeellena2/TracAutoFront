import { apiClient } from '../http/apiClient';
import type { ListaPaginada } from '@/shared/types/api';
import type { SucursalDto, SucursalDetalleDto, CreateSucursalRequest } from '@/features/alquileres/types/sucursal';
import type {
  VehiculoAlquilerDto,
  VehiculoAlquilerDetalleDto,
  DisponibilidadDiaDto,
  AddVehiculoAlquilerRequest,
  UpdateVehiculoAlquilerRequest,
} from '@/features/alquileres/types/vehiculoAlquiler';
import type { TarifaAlquilerDto, CreateTarifaRequest, UpdateTarifaRequest } from '@/features/alquileres/types/tarifa';
import type { RecargoAlquilerDto, CreateRecargoRequest, UpdateRecargoRequest } from '@/features/alquileres/types/recargo';
import type { CoberturaAlquilerDto, CreateCoberturaRequest, UpdateCoberturaRequest } from '@/features/alquileres/types/cobertura';
import type { PromocionAlquilerDto, ValidacionPromocionDto, CreatePromocionRequest, UpdatePromocionRequest } from '@/features/alquileres/types/promocion';
import type {
  ReservaAlquilerResumenDto,
  ReservaAlquilerDetalleDto,
  ReservaCalendarioDto,
  CheckOutAlquilerDto,
  CheckInAlquilerDto,
  FotoInspeccionDto,
  CancelarReservaRequest,
  NoShowReservaRequest,
  CreateCheckOutRequest,
  CreateCheckInRequest,
  RegistrarPagoManualRequest,
  CreateReservaAlquilerRequest,
  DetallePagoReservaDto,
  CreatePaymentIntentRequest,
  CreatePaymentIntentResult,
  LiberarDepositoRequest,
  DeducirDepositoRequest,
} from '@/features/alquileres/types/reserva';
import type { ClienteAlquilerDto, ClienteAlquilerDetalleDto, CreateClienteAlquilerRequest } from '@/features/alquileres/types/cliente';
import type { ResultadoCotizacionDto } from '@/features/alquileres/types/cotizacion';
import type {
  PlantillaContratoDto,
  PlantillaContratoDetalleDto,
  ContratoAlquilerDto,
  CreatePlantillaContratoRequest,
  UpdatePlantillaContratoRequest,
  GenerarContratoRequest,
  FirmarContratoRequest,
} from '@/features/alquileres/types/contrato';
import type { ConfiguracionAlquilerDto, UpdateConfiguracionAlquilerRequest } from '@/features/alquileres/types/configuracion';
import type {
  UtilizacionFlotaDto,
  IngresosDto,
  EstadisticasReservasDto,
  TopVehiculosDto,
  ExportarReporteParams,
} from '@/features/alquileres/types/reportes';

// =====================================================
// API para el modulo de alquileres B2B
// Organizado por sub-recurso del backend
// =====================================================

// --- Helpers ---

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => q.append(key, String(v)));
      } else {
        q.append(key, String(value));
      }
    }
  }
  return q.toString();
}

function urlWithQuery(base: string, params: Record<string, unknown>): string {
  const q = buildQuery(params);
  return q ? `${base}?${q}` : base;
}

// =====================================================
// SUCURSALES — api/v1/sucursales
// =====================================================

export const sucursalesApi = {
  list: async (params?: {
    numeroPagina?: number;
    tamanoPagina?: number;
    soloActivas?: boolean;
    ciudad?: string;
    buscar?: string;
    ordenarPor?: string;
    descendente?: boolean;
  }) => {
    const url = urlWithQuery('sucursales', params ?? {});
    const r = await apiClient.get<ListaPaginada<SucursalDto>>(url);
    return r.data;
  },

  getById: async (id: string) => {
    const r = await apiClient.get<SucursalDetalleDto>(`sucursales/${id}`);
    return r.data;
  },

  create: async (data: CreateSucursalRequest) => {
    const r = await apiClient.post<SucursalDetalleDto>('sucursales', data);
    return r.data;
  },

  update: async (id: string, data: CreateSucursalRequest) => {
    const r = await apiClient.put<SucursalDetalleDto>(`sucursales/${id}`, { id, ...data });
    return r.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`sucursales/${id}`);
  },
};

// =====================================================
// VEHICULOS ALQUILER — api/v1/alquiler/vehiculos
// =====================================================

const VEHICULOS_BASE = 'alquiler/vehiculos';

export const vehiculosAlquilerApi = {
  list: async (params?: {
    numeroPagina?: number;
    tamanoPagina?: number;
    categoria?: number;
    estado?: number;
    sucursalId?: string;
    soloActivos?: boolean;
    buscar?: string;
    disponibleDesde?: string;
    disponibleHasta?: string;
    ordenarPor?: string;
    descendente?: boolean;
  }, signal?: AbortSignal) => {
    const url = urlWithQuery(VEHICULOS_BASE, params ?? {});
    const r = await apiClient.get<ListaPaginada<VehiculoAlquilerDto>>(url, { signal });
    return r.data;
  },

  getById: async (id: string) => {
    const r = await apiClient.get<VehiculoAlquilerDetalleDto>(`${VEHICULOS_BASE}/${id}`);
    return r.data;
  },

  getDisponibilidad: async (id: string, params: { mes: number; anio: number }) => {
    const url = urlWithQuery(`${VEHICULOS_BASE}/${id}/disponibilidad`, params);
    const r = await apiClient.get<DisponibilidadDiaDto[]>(url);
    return r.data;
  },

  add: async (data: AddVehiculoAlquilerRequest) => {
    const r = await apiClient.post<VehiculoAlquilerDetalleDto>(VEHICULOS_BASE, data);
    return r.data;
  },

  update: async (id: string, data: UpdateVehiculoAlquilerRequest) => {
    const r = await apiClient.put<VehiculoAlquilerDetalleDto>(`${VEHICULOS_BASE}/${id}`, data);
    return r.data;
  },

  changeEstado: async (id: string, data: { id: string; nuevoEstado: number }) => {
    await apiClient.put(`${VEHICULOS_BASE}/${id}/estado`, data);
  },

  remove: async (id: string) => {
    await apiClient.delete(`${VEHICULOS_BASE}/${id}`);
  },
};

// =====================================================
// TARIFAS — api/v1/alquiler/tarifas
// =====================================================

const TARIFAS_BASE = 'alquiler/tarifas';

export const tarifasApi = {
  list: async (params?: {
    numeroPagina?: number;
    tamanoPagina?: number;
    categoriaAlquiler?: number;
    sucursalId?: string;
    soloActivas?: boolean;
    buscar?: string;
    unidadTiempo?: number;
    ordenarPor?: string;
    descendente?: boolean;
  }) => {
    const url = urlWithQuery(TARIFAS_BASE, params ?? {});
    const r = await apiClient.get<ListaPaginada<TarifaAlquilerDto>>(url);
    return r.data;
  },

  getById: async (id: string) => {
    const r = await apiClient.get<TarifaAlquilerDto>(`${TARIFAS_BASE}/${id}`);
    return r.data;
  },

  create: async (data: CreateTarifaRequest) => {
    const r = await apiClient.post<TarifaAlquilerDto>(TARIFAS_BASE, data);
    return r.data;
  },

  update: async (id: string, data: UpdateTarifaRequest) => {
    const r = await apiClient.put<TarifaAlquilerDto>(`${TARIFAS_BASE}/${id}`, data);
    return r.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`${TARIFAS_BASE}/${id}`);
  },
};

// =====================================================
// RECARGOS — api/v1/alquiler/recargos
// =====================================================

const RECARGOS_BASE = 'alquiler/recargos';

export const recargosApi = {
  list: async (params?: {
    numeroPagina?: number;
    tamanoPagina?: number;
    tipoRecargo?: number;
    categoriaAlquiler?: number;
    soloActivos?: boolean;
    soloObligatorios?: boolean;
    buscar?: string;
    ordenarPor?: string;
    descendente?: boolean;
  }) => {
    const url = urlWithQuery(RECARGOS_BASE, params ?? {});
    const r = await apiClient.get<ListaPaginada<RecargoAlquilerDto>>(url);
    return r.data;
  },

  create: async (data: CreateRecargoRequest) => {
    const r = await apiClient.post<RecargoAlquilerDto>(RECARGOS_BASE, data);
    return r.data;
  },

  update: async (id: string, data: UpdateRecargoRequest) => {
    const r = await apiClient.put<RecargoAlquilerDto>(`${RECARGOS_BASE}/${id}`, data);
    return r.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`${RECARGOS_BASE}/${id}`);
  },
};

// =====================================================
// COBERTURAS — api/v1/alquiler/coberturas
// =====================================================

const COBERTURAS_BASE = 'alquiler/coberturas';

export const coberturasApi = {
  list: async (params?: {
    numeroPagina?: number;
    tamanoPagina?: number;
    soloActivas?: boolean;
    soloObligatorias?: boolean;
    buscar?: string;
    ordenarPor?: string;
    descendente?: boolean;
  }) => {
    const url = urlWithQuery(COBERTURAS_BASE, params ?? {});
    const r = await apiClient.get<ListaPaginada<CoberturaAlquilerDto>>(url);
    return r.data;
  },

  create: async (data: CreateCoberturaRequest) => {
    const r = await apiClient.post<CoberturaAlquilerDto>(COBERTURAS_BASE, data);
    return r.data;
  },

  update: async (id: string, data: UpdateCoberturaRequest) => {
    const r = await apiClient.put<CoberturaAlquilerDto>(`${COBERTURAS_BASE}/${id}`, data);
    return r.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`${COBERTURAS_BASE}/${id}`);
  },
};

// =====================================================
// PROMOCIONES — api/v1/alquiler/promociones
// =====================================================

const PROMOCIONES_BASE = 'alquiler/promociones';

export const promocionesApi = {
  list: async (params?: {
    numeroPagina?: number;
    tamanoPagina?: number;
    soloActivas?: boolean;
    soloVigentes?: boolean;
    buscar?: string;
    ordenarPor?: string;
    descendente?: boolean;
  }) => {
    const url = urlWithQuery(PROMOCIONES_BASE, params ?? {});
    const r = await apiClient.get<ListaPaginada<PromocionAlquilerDto>>(url);
    return r.data;
  },

  validar: async (params: { codigo: string; montoReserva: number }) => {
    const url = urlWithQuery(`${PROMOCIONES_BASE}/validar`, params);
    const r = await apiClient.get<ValidacionPromocionDto>(url);
    return r.data;
  },

  create: async (data: CreatePromocionRequest) => {
    const r = await apiClient.post<PromocionAlquilerDto>(PROMOCIONES_BASE, data);
    return r.data;
  },

  update: async (id: string, data: UpdatePromocionRequest) => {
    const r = await apiClient.put<PromocionAlquilerDto>(`${PROMOCIONES_BASE}/${id}`, data);
    return r.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`${PROMOCIONES_BASE}/${id}`);
  },
};

// =====================================================
// CLIENTES — api/v1/alquiler/clientes
// =====================================================

const CLIENTES_BASE = 'alquiler/clientes';

export const clientesAlquilerApi = {
  list: async (params?: {
    numeroPagina?: number;
    tamanoPagina?: number;
    buscar?: string;
    ordenarPor?: string;
    descendente?: boolean;
  }, signal?: AbortSignal) => {
    const url = urlWithQuery(CLIENTES_BASE, params ?? {});
    const r = await apiClient.get<ListaPaginada<ClienteAlquilerDto>>(url, { signal });
    return r.data;
  },

  getById: async (id: string) => {
    const r = await apiClient.get<ClienteAlquilerDetalleDto>(`${CLIENTES_BASE}/${id}`);
    return r.data;
  },

  create: async (data: CreateClienteAlquilerRequest) => {
    const r = await apiClient.post<string>(CLIENTES_BASE, data);
    return r.data;
  },

  update: async (id: string, data: Partial<CreateClienteAlquilerRequest>) => {
    await apiClient.put(`${CLIENTES_BASE}/${id}`, data);
  },
};

// =====================================================
// RESERVAS — api/v1/alquiler/reservas
// =====================================================

const RESERVAS_BASE = 'alquiler/reservas';

export const reservasApi = {
  list: async (params?: {
    numeroPagina?: number;
    tamanoPagina?: number;
    estado?: number;
    sucursalId?: string;
    clienteAlquilerId?: string;
    vehiculoAlquilerId?: string;
    origenReserva?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    buscar?: string;
    ordenarPor?: string;
    descendente?: boolean;
  }) => {
    const url = urlWithQuery(RESERVAS_BASE, params ?? {});
    const r = await apiClient.get<ListaPaginada<ReservaAlquilerResumenDto>>(url);
    return r.data;
  },

  getById: async (id: string) => {
    const r = await apiClient.get<ReservaAlquilerDetalleDto>(`${RESERVAS_BASE}/${id}`);
    return r.data;
  },

  getCheckOut: async (reservaId: string) => {
    const r = await apiClient.get<CheckOutAlquilerDto>(`${RESERVAS_BASE}/${reservaId}/check-out`);
    return r.data;
  },

  getCheckIn: async (reservaId: string) => {
    const r = await apiClient.get<CheckInAlquilerDto>(`${RESERVAS_BASE}/${reservaId}/check-in`);
    return r.data;
  },

  getFotos: async (reservaId: string) => {
    const r = await apiClient.get<FotoInspeccionDto[]>(`${RESERVAS_BASE}/${reservaId}/fotos`);
    return r.data;
  },

  getCalendario: async (params: { fechaDesde: string; fechaHasta: string; sucursalId?: string }) => {
    const url = urlWithQuery(`${RESERVAS_BASE}/calendario`, params);
    const r = await apiClient.get<ReservaCalendarioDto[]>(url);
    return r.data;
  },

  crear: async (data: CreateReservaAlquilerRequest) => {
    const r = await apiClient.post<ReservaAlquilerDetalleDto>(RESERVAS_BASE, data);
    return r.data;
  },

  confirmar: async (id: string) => {
    const r = await apiClient.post<ReservaAlquilerDetalleDto>(`${RESERVAS_BASE}/${id}/confirmar`);
    return r.data;
  },

  modificar: async (id: string, data: unknown) => {
    const r = await apiClient.put<ReservaAlquilerDetalleDto>(`${RESERVAS_BASE}/${id}`, data);
    return r.data;
  },

  cancelar: async (id: string, data: CancelarReservaRequest) => {
    const r = await apiClient.post<ReservaAlquilerDetalleDto>(`${RESERVAS_BASE}/${id}/cancelar`, data);
    return r.data;
  },

  marcarNoShow: async (id: string, data: NoShowReservaRequest) => {
    const r = await apiClient.post<ReservaAlquilerDetalleDto>(`${RESERVAS_BASE}/${id}/noshow`, data);
    return r.data;
  },

  realizarCheckOut: async (id: string, data: CreateCheckOutRequest) => {
    const r = await apiClient.post<CheckOutAlquilerDto>(`${RESERVAS_BASE}/${id}/check-out`, data);
    return r.data;
  },

  realizarCheckIn: async (id: string, data: CreateCheckInRequest) => {
    const r = await apiClient.post<CheckInAlquilerDto>(`${RESERVAS_BASE}/${id}/check-in`, data);
    return r.data;
  },

  subirFotos: async (id: string, formData: FormData) => {
    const r = await apiClient.post<FotoInspeccionDto[]>(`${RESERVAS_BASE}/${id}/fotos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return r.data;
  },
};

// =====================================================
// CONTRATOS — api/v1/alquiler/contratos
// =====================================================

const CONTRATOS_BASE = 'alquiler/contratos';

export const contratosApi = {
  getPlantillas: async (params?: {
    numeroPagina?: number;
    tamanoPagina?: number;
    buscar?: string;
    soloActivas?: boolean;
    ordenarPor?: string;
    descendente?: boolean;
  }) => {
    const url = urlWithQuery(`${CONTRATOS_BASE}/plantillas`, params ?? {});
    const r = await apiClient.get<ListaPaginada<PlantillaContratoDto>>(url);
    return r.data;
  },

  getPlantillaById: async (id: string) => {
    const r = await apiClient.get<PlantillaContratoDetalleDto>(`${CONTRATOS_BASE}/plantillas/${id}`);
    return r.data;
  },

  crearPlantilla: async (data: CreatePlantillaContratoRequest) => {
    const r = await apiClient.post<PlantillaContratoDetalleDto>(`${CONTRATOS_BASE}/plantillas`, data);
    return r.data;
  },

  actualizarPlantilla: async (id: string, data: UpdatePlantillaContratoRequest) => {
    const r = await apiClient.put<PlantillaContratoDetalleDto>(`${CONTRATOS_BASE}/plantillas/${id}`, data);
    return r.data;
  },

  generar: async (data: GenerarContratoRequest) => {
    const r = await apiClient.post<ContratoAlquilerDto>(`${CONTRATOS_BASE}/generar`, data);
    return r.data;
  },

  getByReserva: async (reservaId: string) => {
    const r = await apiClient.get<ContratoAlquilerDto>(`${CONTRATOS_BASE}/reserva/${reservaId}`);
    return r.data;
  },

  firmar: async (id: string, data: FirmarContratoRequest) => {
    const r = await apiClient.post<ContratoAlquilerDto>(`${CONTRATOS_BASE}/${id}/firmar`, data);
    return r.data;
  },

  getPdf: async (id: string) => {
    const r = await apiClient.get<{ url: string }>(`${CONTRATOS_BASE}/${id}/pdf`);
    return r.data;
  },
};

// =====================================================
// PAGOS — api/v1/alquiler/pagos
// =====================================================

const PAGOS_BASE = 'alquiler/pagos';

export const pagosAlquilerApi = {
  getByReserva: async (reservaId: string) => {
    const r = await apiClient.get<DetallePagoReservaDto[]>(`${PAGOS_BASE}/reserva/${reservaId}`);
    return r.data;
  },

  registrarManual: async (data: RegistrarPagoManualRequest) => {
    const r = await apiClient.post<string>(PAGOS_BASE, data);
    return r.data;
  },

  createPaymentIntent: async (data: CreatePaymentIntentRequest) => {
    const r = await apiClient.post<CreatePaymentIntentResult>(`${PAGOS_BASE}/stripe/payment-intent`, data);
    return r.data;
  },

  liberarDeposito: async (data: LiberarDepositoRequest) => {
    const r = await apiClient.post<DetallePagoReservaDto>(`${PAGOS_BASE}/deposito/liberar`, data);
    return r.data;
  },

  deducirDeposito: async (data: DeducirDepositoRequest) => {
    const r = await apiClient.post<DetallePagoReservaDto>(`${PAGOS_BASE}/deposito/deducir`, data);
    return r.data;
  },
};

// =====================================================
// COTIZACION — api/v1/alquiler/cotizacion
// =====================================================

export const cotizacionApi = {
  cotizar: async (params: {
    vehiculoAlquilerId?: string;
    categoriaAlquiler?: number;
    sucursalRecogidaId: string;
    sucursalDevolucionId: string;
    fechaHoraRecogida: string;
    fechaHoraDevolucion: string;
    recargosSeleccionadosIds?: string[];
    coberturasSeleccionadasIds?: string[];
    codigoPromocion?: string;
  }) => {
    const url = urlWithQuery('alquiler/cotizacion', params);
    const r = await apiClient.get<ResultadoCotizacionDto>(url);
    return r.data;
  },
};

// =====================================================
// CONFIGURACION — api/v1/alquiler/configuracion
// =====================================================

export const configuracionAlquilerApi = {
  get: async (): Promise<ConfiguracionAlquilerDto> => {
    const r = await apiClient.get<ConfiguracionAlquilerDto>('alquiler/configuracion');
    return r.data;
  },

  update: async (data: UpdateConfiguracionAlquilerRequest): Promise<ConfiguracionAlquilerDto> => {
    const r = await apiClient.put<ConfiguracionAlquilerDto>('alquiler/configuracion', data);
    return r.data;
  },
};

// =====================================================
// REPORTES — api/v1/alquiler/reportes
// =====================================================

const REPORTES_BASE = 'alquiler/reportes';

export const reportesAlquilerApi = {
  getUtilizacionFlota: async (params: {
    fechaInicio: string;
    fechaFin: string;
    sucursalId?: string;
    categoria?: number;
  }): Promise<UtilizacionFlotaDto> => {
    const url = urlWithQuery(`${REPORTES_BASE}/utilizacion-flota`, params);
    const r = await apiClient.get<UtilizacionFlotaDto>(url);
    return r.data;
  },

  getIngresos: async (params: {
    fechaInicio: string;
    fechaFin: string;
    agrupacion?: number;
    sucursalId?: string;
    categoria?: number;
  }): Promise<IngresosDto> => {
    const url = urlWithQuery(`${REPORTES_BASE}/ingresos`, params);
    const r = await apiClient.get<IngresosDto>(url);
    return r.data;
  },

  getEstadisticasReservas: async (params: {
    fechaInicio: string;
    fechaFin: string;
  }): Promise<EstadisticasReservasDto> => {
    const url = urlWithQuery(`${REPORTES_BASE}/estadisticas-reservas`, params);
    const r = await apiClient.get<EstadisticasReservasDto>(url);
    return r.data;
  },

  getTopVehiculos: async (params: {
    fechaInicio: string;
    fechaFin: string;
    top?: number;
    ordenarPor?: number;
  }): Promise<TopVehiculosDto> => {
    const url = urlWithQuery(`${REPORTES_BASE}/top-vehiculos`, params);
    const r = await apiClient.get<TopVehiculosDto>(url);
    return r.data;
  },

  exportar: async (params: ExportarReporteParams): Promise<Blob> => {
    const url = urlWithQuery(`${REPORTES_BASE}/exportar`, { ...params });
    const r = await apiClient.get(url, { responseType: 'blob' });
    return r.data;
  },
};
