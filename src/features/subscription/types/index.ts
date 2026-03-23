import { ModuloSistema } from '@/shared/types/api';

export interface ModuloActivoDto {
  codigo: ModuloSistema;
  nombre: string;
  icono?: string;
  fechaActivacion: string;
  activadoPorUsuarioId?: string;
  notas?: string;
}

export interface ModuloDisponibleDto {
  codigo: ModuloSistema;
  nombre: string;
  descripcion: string;
  icono?: string;
  orden: number;
  esBase: boolean;
  esGratis: boolean;
  estaActivo: boolean;
  fechaActivacion?: string;
  cumplePrerequisitos: boolean;
  prerequisitosFaltantes: string[];
}
