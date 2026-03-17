import type { TipoReglaAlerta, TipoNotificacion, ListaPaginada } from '@/features/dashboard/types';

export type { ListaPaginada };
export { TipoReglaAlerta, TipoNotificacion } from '@/features/dashboard/types';

export interface ReglaAlertaDto {
  id: string;
  nombre: string;
  tipo: TipoReglaAlerta;
  configuracionJson: string;
  severidad: TipoNotificacion;
  cooldownSegundos: number;
  vehiculoId: string | null;
  dispositivoId: string | null;
  geofenceId: string | null;
  activo: boolean;
  notificarInApp: boolean;
  notificarSignalR: boolean;
  notificarPush: boolean;
  notificarEmail: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CreateReglaAlertaCommand {
  nombre: string;
  tipo: TipoReglaAlerta;
  configuracionJson: string;
  severidad?: TipoNotificacion;
  cooldownSegundos?: number;
  vehiculoId?: string;
  dispositivoId?: string;
  geofenceId?: string;
  notificarInApp?: boolean;
  notificarSignalR?: boolean;
  notificarPush?: boolean;
  notificarEmail?: boolean;
}

export interface UpdateReglaAlertaCommand extends CreateReglaAlertaCommand {
  id: string;
}

export interface ListReglasAlertaParams {
  numeroPagina?: number;
  tamanoPagina?: number;
  ordenarPor?: string;
  descendente?: boolean;
  tipo?: TipoReglaAlerta;
  severidad?: TipoNotificacion;
  vehiculoId?: string;
  soloActivas?: boolean;
  buscar?: string;
}
