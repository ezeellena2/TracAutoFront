import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { Code, Eye } from 'lucide-react';
import { PLACEHOLDER_GROUPS, DATOS_EJEMPLO, reemplazarPlaceholders } from '../utils/contrato-placeholders';

interface EditorPlantillaProps {
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
}

type Tab = 'editor' | 'preview';

export function EditorPlantilla({ value, onChange, readOnly }: EditorPlantillaProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('editor');

  const handleInsertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);

    onChange(before + placeholder + after);

    // Restaurar cursor despues del placeholder insertado
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + placeholder.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  const previewHtml = reemplazarPlaceholders(value, DATOS_EJEMPLO);

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'editor'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Code size={14} />
          {t('alquileres.contratos.editor.tabEditor')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'preview'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Eye size={14} />
          {t('alquileres.contratos.editor.tabPreview')}
        </button>
      </div>

      {activeTab === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Textarea */}
          <div className="lg:col-span-2">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              readOnly={readOnly}
              rows={20}
              className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-text font-mono text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-y"
              placeholder="<html>..."
            />
          </div>

          {/* Panel de placeholders */}
          <div className="border border-border rounded-lg p-4 bg-surface overflow-y-auto max-h-[500px]">
            <h4 className="text-sm font-semibold text-text mb-1">
              {t('alquileres.contratos.editor.placeholders')}
            </h4>
            <p className="text-xs text-text-muted mb-3">
              {t('alquileres.contratos.editor.placeholdersHelp')}
            </p>

            <div className="space-y-4">
              {PLACEHOLDER_GROUPS.map((group) => (
                <div key={group.grupo}>
                  <h5 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                    {t(group.labelKey)}
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {group.placeholders.map((ph) => (
                      <button
                        key={ph.key}
                        type="button"
                        onClick={() => handleInsertPlaceholder(ph.key)}
                        disabled={readOnly}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={ph.key}
                      >
                        {t(ph.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Preview tab */
        <div>
          <p className="text-xs text-text-muted mb-3 italic">
            {t('alquileres.contratos.editor.datosEjemplo')}
          </p>
          <div
            className="border border-border rounded-lg p-6 bg-white min-h-[300px] prose prose-sm max-w-none [&_p]:text-sm [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_table]:border-collapse [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-gray-300 [&_th]:px-2 [&_th]:py-1"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }}
          />
        </div>
      )}
    </div>
  );
}
