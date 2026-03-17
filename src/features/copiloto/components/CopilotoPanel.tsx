import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, Plus, MessageSquare, Trash2, Copy } from 'lucide-react';
import { useCopiloto } from '../hooks/useCopiloto';
import { RolMensajeCopiloto, TipoRespuestaCopiloto } from '../types';
import type { MensajeCopilotoDto } from '../types';
import { CopilotoSugerencias } from './CopilotoSugerencias';
import { CopilotoRespuesta } from './CopilotoRespuesta';

/** Parsea la metadata JSON de un mensaje del asistente para extraer tipo y datos estructurados */
function parsearMetadata(msg: MensajeCopilotoDto): {
  tipo: TipoRespuestaCopiloto;
  datosEstructurados: unknown | null;
  accionSugerida: { label: string; ruta: string } | null;
} {
  if (!msg.metadata) {
    return { tipo: TipoRespuestaCopiloto.Texto, datosEstructurados: null, accionSugerida: null };
  }

  try {
    const parsed = JSON.parse(msg.metadata) as {
      tipo?: number;
      datosEstructurados?: unknown;
      accionSugerida?: { label: string; ruta: string } | null;
    };

    return {
      tipo: (parsed.tipo as TipoRespuestaCopiloto) ?? TipoRespuestaCopiloto.Texto,
      datosEstructurados: parsed.datosEstructurados ?? null,
      accionSugerida: parsed.accionSugerida ?? null,
    };
  } catch {
    return { tipo: TipoRespuestaCopiloto.Texto, datosEstructurados: null, accionSugerida: null };
  }
}

interface CopilotoPanelProps {
  onClose: () => void;
}

export function CopilotoPanel({ onClose }: CopilotoPanelProps) {
  const { t } = useTranslation();
  const {
    mensajes,
    conversaciones,
    usoDiario,
    enviando,
    error,
    enviarMensaje,
    nuevaConversacion,
    cargarConversacion,
    eliminarConversacion,
    copiarRespuesta,
  } = useCopiloto();

  const [input, setInput] = useState('');
  const [showConversaciones, setShowConversaciones] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (input.trim() && !enviando) {
      void enviarMensaje(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <h2 className="font-semibold text-text">{t('copiloto.titulo')}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConversaciones(!showConversaciones)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
            title={t('copiloto.conversaciones')}
          >
            <MessageSquare size={18} />
          </button>
          <button
            onClick={nuevaConversacion}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
            title={t('copiloto.nuevaConversacion')}
          >
            <Plus size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-red-500/80 transition-colors"
            title={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Conversaciones drawer */}
      {showConversaciones && (
        <div className="border-b border-border bg-background px-4 py-2 max-h-48 overflow-y-auto flex-shrink-0">
          <p className="text-xs font-medium text-text-muted mb-2">{t('copiloto.conversaciones')}</p>
          {conversaciones.length === 0 ? (
            <p className="text-xs text-text-muted py-2">{t('copiloto.sinConversaciones')}</p>
          ) : (
            conversaciones.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-surface cursor-pointer group"
              >
                <button
                  onClick={() => {
                    void cargarConversacion(c.id);
                    setShowConversaciones(false);
                  }}
                  className="text-sm text-text truncate flex-1 text-left"
                >
                  {c.titulo}
                </button>
                <button
                  onClick={() => void eliminarConversacion(c.id)}
                  className="p-1 rounded text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">AI</span>
            </div>
            <p className="text-text-muted text-sm text-center">{t('copiloto.placeholder')}</p>
            <CopilotoSugerencias onSugerencia={(s) => void enviarMensaje(s)} />
          </div>
        ) : (
          mensajes.map((msg) => {
            const isUser = msg.rol === RolMensajeCopiloto.Usuario;
            const meta = !isUser ? parsearMetadata(msg) : null;
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    isUser
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-background text-text rounded-bl-sm'
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.contenido}</p>
                  ) : (
                    <div className="relative group">
                      <CopilotoRespuesta
                        contenido={msg.contenido}
                        tipo={meta?.tipo ?? TipoRespuestaCopiloto.Texto}
                        datosEstructurados={meta?.datosEstructurados}
                        accionSugerida={meta?.accionSugerida}
                      />
                      <button
                        onClick={() => void copiarRespuesta(msg.contenido)}
                        className="absolute top-0 right-0 p-1 rounded opacity-0 group-hover:opacity-100 text-text-muted hover:text-text transition-all"
                        title={t('copiloto.copiarRespuesta')}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {enviando && (
          <div className="flex justify-start">
            <div className="bg-background rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Usage indicator */}
      {usoDiario && (
        <div className="px-4 py-1 border-t border-border flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{t('copiloto.usoDiario')}</span>
            <span>{Math.round(usoDiario.porcentajeUso)}%</span>
          </div>
          <div className="w-full h-1 bg-background rounded-full mt-1">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(usoDiario.porcentajeUso, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('copiloto.placeholder')}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary max-h-32"
            rows={1}
            disabled={enviando}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || enviando}
            className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
