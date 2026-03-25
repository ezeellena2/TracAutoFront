import { ModuloSistema } from '@/shared/types/api';

export interface ModuloActivoDto {
  codigo: ModuloSistema;
  nombre: string;
  icono?: string;
  fechaActivacion?: string | null;
  activadoPorUsuarioId?: string;
  notas?: string;
  soporteContexto: 'Personal' | 'Organizacion' | 'Ambos' | string;
  capacidadesEfectivas: string[];
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
  soporteContexto: 'Personal' | 'Organizacion' | 'Ambos' | string;
  esOperativo: boolean;
  puedeGestionarse: boolean;
  puedeActivarse: boolean;
  capacidadesEfectivas: string[];
}
