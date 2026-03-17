import type { CategoriaScore } from '../types';

export function getCategoriaColor(categoria: CategoriaScore): string {
  switch (categoria) {
    case 'Excelente':
      return 'text-emerald-600 bg-emerald-50';
    case 'Bueno':
      return 'text-blue-600 bg-blue-50';
    case 'Regular':
      return 'text-amber-600 bg-amber-50';
    case 'Riesgoso':
      return 'text-orange-600 bg-orange-50';
    case 'Critico':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getCategoriaChartColor(categoria: string): string {
  switch (categoria) {
    case 'Excelente':
      return '#059669';
    case 'Bueno':
      return '#2563eb';
    case 'Regular':
      return '#d97706';
    case 'Riesgoso':
      return '#ea580c';
    case 'Critico':
      return '#dc2626';
    default:
      return '#6b7280';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-amber-600';
  if (score >= 30) return 'text-orange-600';
  return 'text-red-600';
}

export function getScoreBarColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 50) return 'bg-amber-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}
