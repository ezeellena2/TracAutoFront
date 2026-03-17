import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Copy, Check, Code2 } from 'lucide-react';
import type { WidgetConfiguracionConApiKeyDto } from '../types';

interface WidgetEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  widget: WidgetConfiguracionConApiKeyDto | null;
}

export function WidgetEmbedModal({ isOpen, onClose, widget }: WidgetEmbedModalProps) {
  const { t } = useTranslation();
  const [copiedField, setCopiedField] = useState<'apiKey' | 'script' | null>(null);

  if (!isOpen || !widget) return null;

  const apiUrl = `${window.location.origin}/api/widget/publico/${widget.apiKey}`;
  const embedScript = `<!-- TracAuto Widget -->
<div id="tracauto-widget-${widget.apiKey.slice(0, 8)}"></div>
<script>
  (function() {
    var s = document.createElement('script');
    s.src = '${window.location.origin}/widget/embed.js';
    s.setAttribute('data-api-key', '${widget.apiKey}');
    s.setAttribute('data-container', 'tracauto-widget-${widget.apiKey.slice(0, 8)}');
    s.async = true;
    document.head.appendChild(s);
  })();
</script>`;

  const handleCopy = async (text: string, field: 'apiKey' | 'script') => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface rounded-xl border border-border w-full max-w-2xl mx-4 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Code2 size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-text">
              {t('widget.embed.titulo')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover text-text-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Widget Info */}
          <div className="bg-background-secondary rounded-lg p-3">
            <p className="text-sm text-text-muted">{t('widget.embed.widgetNombre')}</p>
            <p className="font-semibold text-text">{widget.nombre}</p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('widget.embed.apiKey')}
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-background-secondary border border-border text-sm font-mono text-text break-all">
                {widget.apiKey}
              </code>
              <button
                onClick={() => handleCopy(widget.apiKey, 'apiKey')}
                className="p-2 rounded-lg border border-border hover:bg-surface-hover transition-colors text-text-muted"
                title={t('common.copiar')}
              >
                {copiedField === 'apiKey' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-xs text-amber-500 mt-1">
              ⚠️ {t('widget.embed.apiKeyWarning')}
            </p>
          </div>

          {/* Embed Script */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('widget.embed.codigoEmbed')}
            </label>
            <div className="relative">
              <pre className="px-3 py-3 rounded-lg bg-background-secondary border border-border text-xs font-mono text-text overflow-x-auto whitespace-pre-wrap">
                {embedScript}
              </pre>
              <button
                onClick={() => handleCopy(embedScript, 'script')}
                className="absolute top-2 right-2 p-1.5 rounded border border-border bg-surface hover:bg-surface-hover transition-colors text-text-muted"
                title={t('common.copiar')}
              >
                {copiedField === 'script' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {t('widget.embed.codigoEmbedHelp')}
            </p>
          </div>

          {/* API Endpoint (for reference) */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              {t('widget.embed.apiEndpoint')}
            </label>
            <code className="block px-3 py-2 rounded-lg bg-background-secondary border border-border text-xs font-mono text-text-muted break-all">
              GET {apiUrl}
            </code>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            {t('common.cerrar')}
          </button>
        </div>
      </div>
    </div>
  );
}
