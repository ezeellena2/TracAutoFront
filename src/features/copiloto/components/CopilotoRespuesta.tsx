import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { TipoRespuestaCopiloto } from '../types';
import type { AccionSugeridaDto } from '../types';

interface CopilotoRespuestaProps {
  contenido: string;
  tipo: TipoRespuestaCopiloto;
  datosEstructurados?: unknown;
  accionSugerida?: AccionSugeridaDto | null;
}

// Tipos para datos estructurados del backend
interface TablaResumenData {
  titulo?: string;
  columnas: string[];
  filas: (string | number)[][];
}

interface KpiData {
  items: KpiItem[];
}

interface KpiItem {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  tendencia?: {
    valor: number;
    esPositiva: boolean;
  };
}

export function CopilotoRespuesta({ contenido, tipo, datosEstructurados, accionSugerida }: CopilotoRespuestaProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      {/* Contenido texto siempre presente */}
      {contenido && (
        <div className="prose prose-sm max-w-none text-text whitespace-pre-wrap">
          {contenido}
        </div>
      )}

      {/* Tabla resumen */}
      {tipo === TipoRespuestaCopiloto.TablaResumen && datosEstructurados != null && (
        <TablaResumen datos={datosEstructurados as TablaResumenData} />
      )}

      {/* KPI cards */}
      {tipo === TipoRespuestaCopiloto.Kpi && datosEstructurados != null && (
        <KpiCards datos={datosEstructurados as KpiData} />
      )}

      {/* Accion sugerida */}
      {tipo === TipoRespuestaCopiloto.Accion && accionSugerida && (
        <button
          onClick={() => navigate(accionSugerida.ruta)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {accionSugerida.label}
        </button>
      )}

      {/* Indicador de error */}
      {tipo === TipoRespuestaCopiloto.Error && (
        <div className="flex items-center gap-2 text-red-500 text-xs">
          <span>!</span>
          <span>{t('copiloto.errorRespuesta')}</span>
        </div>
      )}
    </div>
  );
}

function TablaResumen({ datos }: { datos: TablaResumenData }) {
  const { columnas, filas, titulo } = datos;

  if (!columnas?.length || !filas?.length) return null;

  return (
    <div className="mt-2 overflow-x-auto">
      {titulo && (
        <p className="text-xs font-semibold text-text-muted mb-1.5">{titulo}</p>
      )}
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            {columnas.map((col, i) => (
              <th
                key={i}
                className="text-left px-2 py-1.5 font-medium text-text-muted border-b border-border bg-background/50"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {fila.map((celda, j) => (
                <td key={j} className="px-2 py-1.5 text-text">
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KpiCards({ datos }: { datos: KpiData }) {
  const items = datos?.items;

  if (!items?.length) return null;

  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="p-3 rounded-lg border border-border bg-background/50"
        >
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
            {item.titulo}
          </p>
          <p className="mt-1 text-lg font-bold text-text">{item.valor}</p>
          {item.subtitulo && (
            <p className="text-[10px] text-text-muted">{item.subtitulo}</p>
          )}
          {item.tendencia && (
            <div className={`mt-1 flex items-center gap-0.5 text-[10px] ${item.tendencia.esPositiva ? 'text-green-600' : 'text-red-500'}`}>
              {item.tendencia.esPositiva ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              <span>{Math.abs(item.tendencia.valor)}%</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
