import { useTranslation } from 'react-i18next';
import { X, FileText } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { ResumenIADto } from '../types';

interface Props {
  resumen: ResumenIADto;
  onCerrar: () => void;
}

export function ResumenViewer({ resumen, onCerrar }: Props) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('resumenIA.viewer.titulo')}
            </h3>
          </div>
          <button
            onClick={onCerrar}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Periodo */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300">
          {new Date(resumen.periodoDesde).toLocaleDateString()} — {new Date(resumen.periodoHasta).toLocaleDateString()}
          <span className="mx-2">·</span>
          {resumen.tokensConsumidos} tokens
        </div>

        {/* Contenido markdown */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:text-gray-900 dark:prose-headings:text-white
              prose-p:text-gray-700 dark:prose-p:text-gray-300
              prose-li:text-gray-700 dark:prose-li:text-gray-300
              prose-table:text-sm
              prose-th:bg-gray-100 dark:prose-th:bg-gray-700
              prose-td:border-gray-200 dark:prose-td:border-gray-600"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(resumen.contenido)) }}
          />
        </div>
      </div>
    </div>
  );
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\| (.+) \|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      const tds = cells.map(c => `<td class="px-3 py-1 border">${c.trim()}</td>`).join('');
      return `<tr>${tds}</tr>`;
    })
    .replace(/^\|[-|]+\|$/gm, '')
    .replace(/(<tr>.*<\/tr>\n?)+/g, (match) => `<table class="w-full border-collapse">${match}</table>`)
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul class="list-disc pl-5">${match}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hultdp])/gm, (match) => match ? `<p>${match}` : match);
}
