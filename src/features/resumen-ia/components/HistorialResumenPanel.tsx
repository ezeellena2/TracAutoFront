import { useTranslation } from 'react-i18next';
import { Clock, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { CadenciaResumenIA } from '../types';
import type { ResumenIADto, ResumenIAListDto } from '../types';

interface Props {
  historial: ResumenIAListDto;
  pagina: number;
  onCambiarPagina: (pagina: number) => void;
  onVerResumen: (resumen: ResumenIADto) => void;
}

export function HistorialResumenPanel({ historial, pagina, onCambiarPagina, onVerResumen }: Props) {
  const { t } = useTranslation();
  const totalPaginas = Math.ceil(historial.total / 10);

  const cadenciaLabel = (c: CadenciaResumenIA) => {
    switch (c) {
      case CadenciaResumenIA.Diario: return t('resumenIA.cadencia.diario');
      case CadenciaResumenIA.Semanal: return t('resumenIA.cadencia.semanal');
      case CadenciaResumenIA.Mensual: return t('resumenIA.cadencia.mensual');
      default: return '';
    }
  };

  if (historial.resumenes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">{t('resumenIA.sinResumenes')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          {t('resumenIA.historial.titulo')}
        </h3>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {historial.resumenes.map((resumen) => (
          <button
            key={resumen.id}
            onClick={() => onVerResumen(resumen)}
            className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(resumen.periodoDesde).toLocaleDateString()} — {new Date(resumen.periodoHasta).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {cadenciaLabel(resumen.cadencia)} · {resumen.tokensConsumidos} tokens · {new Date(resumen.fechaCreacion).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {resumen.enviadoPorEmail && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">
                    Email
                  </span>
                )}
                {resumen.enviadoPorWhatsApp && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">
                    WhatsApp
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onCambiarPagina(pagina - 1)}
            disabled={pagina <= 1}
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-blue-600"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('resumenIA.historial.anterior')}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t('resumenIA.historial.pagina', { actual: pagina, total: totalPaginas })}
          </span>
          <button
            onClick={() => onCambiarPagina(pagina + 1)}
            disabled={pagina >= totalPaginas}
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:text-blue-600"
          >
            {t('resumenIA.historial.siguiente')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
