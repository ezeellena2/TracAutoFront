export type CategoriaScore = 'Excelente' | 'Bueno' | 'Regular' | 'Riesgoso' | 'Critico';

export interface ConductorScoreResumenDto {
  conductorId: string;
  conductorNombre: string;
  scoreGeneral: number;
  categoria: CategoriaScore;
  scoreAnterior: number | null;
  tendencia: number;
}

export interface ScoreConduccionDto {
  id: string;
  conductorId: string;
  conductorNombre: string;
  fecha: string;
  scoreGeneral: number;
  scoreVelocidad: number;
  scoreFrenado: number;
  scoreAceleracion: number;
  scoreGeocercas: number;
  scoreHorasConduccion: number;
  categoria: CategoriaScore;
  kilometrosRecorridos: number;
  minutosConduccion: number;
  eventosVelocidad: number;
  eventosFrenado: number;
  eventosAceleracion: number;
  eventosGeocerca: number;
  velocidadMaximaRegistrada: number;
  velocidadPromedioKmh: number;
}

export interface TendenciaSemanalDto {
  inicioSemana: string;
  scorePromedio: number;
}

export interface ResumenScoringFlotaDto {
  scorePromedioFlota: number;
  distribucionPorCategoria: Record<string, number>;
  top3Mejores: ConductorScoreResumenDto[];
  top3NecesitanAtencion: ConductorScoreResumenDto[];
  tendenciaUltimas4Semanas: TendenciaSemanalDto[];
  totalConductoresConScore: number;
}

export interface ConfiguracionScoringDto {
  id: string;
  habilitado: boolean;
  pesoVelocidad: number;
  pesoFrenado: number;
  pesoAceleracion: number;
  pesoGeocercas: number;
  pesoHorasConduccion: number;
  umbralFrenadoBruscoMs2: number;
  umbralAceleracionBruscaMs2: number;
  maxHorasContinuasConduccion: number;
  scoreMinimoAlerta: number;
}

export interface ConfigurarScoringRequest {
  habilitado: boolean;
  pesoVelocidad: number;
  pesoFrenado: number;
  pesoAceleracion: number;
  pesoGeocercas: number;
  pesoHorasConduccion: number;
  umbralFrenadoBruscoMs2: number;
  umbralAceleracionBruscaMs2: number;
  maxHorasContinuasConduccion: number;
  scoreMinimoAlerta: number;
}
