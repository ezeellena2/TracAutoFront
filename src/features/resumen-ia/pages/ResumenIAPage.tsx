import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2 } from 'lucide-react';
import { useResumenIA } from '../hooks/useResumenIA';
import { ConfiguracionResumenPanel } from '../components/ConfiguracionResumenPanel';
import { HistorialResumenPanel } from '../components/HistorialResumenPanel';
import { ResumenViewer } from '../components/ResumenViewer';
import { EstadoError } from '@/shared/ui/EstadoError';
import type { ResumenIADto } from '../types';

export function ResumenIAPage() {
  const { t } = useTranslation();
  const {
    configuracion,
    historial,
    cargando,
    guardando,
    generando,
    error,
    pagina,
    actualizarConfiguracion,
    generarManual,
    cargarHistorial,
    recargar,
  } = useResumenIA();

  const [resumenSeleccionado, setResumenSeleccionado] = useState<ResumenIADto | null>(null);

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <EstadoError mensaje={error} onReintentar={() => void recargar()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-blue-600" />
            {t('resumenIA.titulo')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('resumenIA.subtitulo')}
          </p>
        </div>

        <button
          onClick={() => void generarManual()}
          disabled={generando}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {generando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {generando ? t('resumenIA.generando') : t('resumenIA.generarManual')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuracion */}
        {configuracion && (
          <ConfiguracionResumenPanel
            configuracion={configuracion}
            guardando={guardando}
            onGuardar={actualizarConfiguracion}
          />
        )}

        {/* Historial */}
        {historial && (
          <HistorialResumenPanel
            historial={historial}
            pagina={pagina}
            onCambiarPagina={(p) => void cargarHistorial(p)}
            onVerResumen={setResumenSeleccionado}
          />
        )}
      </div>

      {/* Modal de detalle */}
      {resumenSeleccionado && (
        <ResumenViewer
          resumen={resumenSeleccionado}
          onCerrar={() => setResumenSeleccionado(null)}
        />
      )}
    </div>
  );
}
