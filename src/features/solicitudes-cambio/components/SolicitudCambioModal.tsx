import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, ExternalLink, Loader2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useSolicitudChat } from '../hooks/useSolicitudChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useErrorHandler } from '@/hooks';
import type { SolicitudContext } from '@/store/modoSolicitud.store';
import { Modal } from '@/shared/ui/Modal';
import { SolicitudCambioLimits } from '../constants';
import { EstadoSolicitudCambio } from '@/shared/types/api';

const MAX_MENSAJES_USUARIO = SolicitudCambioLimits.MAX_MENSAJES_USUARIO;

interface SolicitudCambioModalProps {
  isOpen?: boolean;
  contexto: SolicitudContext | null;
  onClose: () => void;
  onEnviadoAJira?: () => void;
  /** ID de una solicitud existente (para abrir el modal desde la lista de solicitudes) */
  solicitudId?: string;
}

/** Convierte Markdown básico a HTML para el preview del ticket */
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>');
}

export function SolicitudCambioModal({ isOpen, contexto, onClose, onEnviadoAJira, solicitudId: solicitudIdProp }: SolicitudCambioModalProps) {
  const { t } = useTranslation();
  const { handleApiError, parseError } = useErrorHandler();
  const [showConfirm, setShowConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    solicitud,
    enviarMensaje,
    isSending,
    enviarAJira,
    isEnviando,
    error,
    mensajesUsuario,
  } = useSolicitudChat({ contexto, solicitudId: solicitudIdProp, onEnviadoAJira });

  const errorMessage = error ? parseError(error).message : null;

  useEffect(() => {
    if (error) {
      handleApiError(error, { showToast: false });
    }
  }, [error, handleApiError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [solicitud?.mensajes?.length ?? 0]);

  if (!isOpen || (!contexto && !solicitudIdProp)) return null;

  const mensajes = solicitud?.mensajes ?? [];
  const readyForJira = solicitud?.readyForJira ?? false;
  const jiraIssueKey = solicitud?.jiraIssueKey;
  const jiraIssueUrl = solicitud?.jiraIssueUrl;
  const limitAlcanzado = mensajesUsuario >= MAX_MENSAJES_USUARIO;

  // Extraer datos del ticket del último mensaje assistant con readyForJira
  const lastAssistantMsg = [...mensajes].reverse().find(m => m.rol === 'assistant' && m.readyForJira);
  void lastAssistantMsg; // referenced for future use
  const specJson = solicitud?.specJson ?? null;
  let ticketSummary = solicitud?.label ? `${t('solicitudesCambio.modal.changeRequest', 'Solicitud cambio')}: ${solicitud.label}` : t('solicitudesCambio.modal.changeRequest', 'Solicitud de cambio');
  let ticketDescription = '';
  let ticketLabels: string[] = [];

  if (specJson) {
    try {
      const spec = JSON.parse(specJson);
      if (spec?.jira?.summary) ticketSummary = spec.jira.summary;
      if (spec?.jira?.description_markdown) ticketDescription = spec.jira.description_markdown;
      if (spec?.jira?.labels) ticketLabels = spec.jira.labels;
    } catch {
      // ignore
    }
  }

  const handleSend = async (contenido: string, imagenBase64?: string) => {
    if (!contenido.trim() || limitAlcanzado) return;
    await enviarMensaje(contenido, imagenBase64);
  };

  const handleConfirmarYEnviar = () => {
    enviarAJira();
    setShowConfirm(false);
  };

  return (
    <Modal
      isOpen={Boolean(isOpen && (contexto || solicitudIdProp))}
      onClose={onClose}
      size="2xl"
      dataTracautoSolicitudModal
    >
      <div className="flex flex-col h-[70vh] md:h-[600px] w-full">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border shrink-0">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-text text-lg">{t('solicitudesCambio.modal.changeRequest', 'Solicitud de cambio')}</span>
            {solicitud?.label && (
              <span className="text-xs font-medium text-text-muted bg-surface border border-border px-2 py-0.5 rounded-md w-fit">
                {solicitud.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Counter discreto: solo aparece cuando se acerca al límite */}
            {!jiraIssueKey && mensajesUsuario >= Math.floor(MAX_MENSAJES_USUARIO * 0.7) && (
              <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full border border-warning/20">
                {mensajesUsuario}/{MAX_MENSAJES_USUARIO} {t('solicitudesCambio.modal.messages', 'mensajes')}
              </span>
            )}
            <button className="text-text-muted hover:text-text hover:bg-surface rounded p-1 transition-colors" onClick={onClose} aria-label={t('common.close', 'Cerrar')}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Cuerpos de estado */}
        <div className="flex flex-col flex-1 overflow-hidden min-h-0 pt-4 pb-2">
          {/* Jira enviado */}
          {jiraIssueKey && jiraIssueUrl && (
            <div className="flex items-center gap-2 bg-success/10 border border-success/20 text-success px-4 py-3 rounded-xl mb-4 text-sm shrink-0">
              <CheckCircle size={16} />
              <span className="font-medium">{t('solicitudesCambio.modal.ticketCreated', 'Ticket creado:')}</span>
              <a href={jiraIssueUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold hover:underline">
                {jiraIssueKey} <ExternalLink size={12} />
              </a>
            </div>
          )}

          {/* Panel de confirmación */}
          {showConfirm ? (
            <div className="flex flex-col flex-1 overflow-auto bg-background rounded-xl border border-border">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
                <button className="p-1 rounded text-text-muted hover:text-text hover:bg-surface" onClick={() => setShowConfirm(false)}>
                  <ChevronLeft size={18} />
                </button>
                <h3 className="font-semibold text-sm">{t('solicitudesCambio.modal.ticketPreview', 'Vista previa del ticket')}</h3>
              </div>

              <div className="flex flex-col gap-4 p-4 text-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-text-muted text-xs uppercase tracking-wider">{t('solicitudesCambio.modal.summary', 'Resumen')}</label>
                  <p className="font-medium">{ticketSummary}</p>
                </div>

                {ticketLabels.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="font-medium text-text-muted text-xs uppercase tracking-wider">{t('solicitudesCambio.modal.labels', 'Etiquetas')}</label>
                    <div className="flex flex-wrap gap-2">
                      {ticketLabels.map((l) => (
                        <span key={l} className="bg-surface border border-border text-xs px-2 py-1 rounded">{l}</span>
                      ))}
                    </div>
                  </div>
                )}

                {ticketDescription && (
                  <div className="flex flex-col gap-1">
                    <label className="font-medium text-text-muted text-xs uppercase tracking-wider">{t('solicitudesCambio.modal.description', 'Descripción')}</label>
                    <div
                      className="prose prose-sm max-w-none text-text-muted [&_p]:text-sm [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_a]:text-primary"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(markdownToHtml(ticketDescription)) }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-4 border-t border-border mt-auto sticky bottom-0 bg-background z-10">
                <button
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-surface hover:bg-surface/80 text-text transition-colors"
                  onClick={() => setShowConfirm(false)}
                >
                  {t('common.cancel', 'Cancelar')}
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors disabled:opacity-50"
                  onClick={handleConfirmarYEnviar}
                  disabled={isEnviando}
                >
                  {isEnviando ? (
                    <><Loader2 size={14} className="animate-spin" /> {t('solicitudesCambio.modal.sending', 'Enviando...')}</>
                  ) : (
                    <>{t('solicitudesCambio.modal.confirmAndSend', 'Confirmar y enviar a Jira')}</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col flex-1 gap-4 overflow-y-auto pr-2 scrollbar-thin">
                {mensajes.length === 0 && !isSending && (
                  <div className="flex flex-col items-center justify-center text-center p-6 bg-surface/50 border border-border border-dashed rounded-xl m-auto max-w-sm">
                    <p className="text-sm text-text mb-1">
                      {t('solicitudesCambio.modal.describeChange', 'Describí el cambio que necesitás en')} <strong className="font-semibold text-primary">{solicitud?.label ?? contexto?.label ?? t('solicitudesCambio.modal.thisElement', 'este elemento')}</strong>.
                    </p>
                    <p className="text-xs text-text-muted">
                      {t('solicitudesCambio.modal.describeChangeHint', 'El asistente puede hacerte preguntas para entender mejor qué necesitás.')}
                    </p>
                  </div>
                )}
                {mensajes.map((m) => (
                  <ChatMessage key={m.id} message={m} />
                ))}
                {isSending && (
                  <div className="flex items-center gap-2 text-xs text-text-muted py-2">
                    <Loader2 size={14} className="animate-spin" /> {t('solicitudesCambio.modal.processing', 'Procesando...')}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-sm text-error bg-error/10 border border-error/20 rounded-lg p-3 my-2 shrink-0">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {/* Limit reached message */}
              {limitAlcanzado && !readyForJira && (
                <div className="text-center text-xs font-medium text-warning bg-warning/10 border border-warning/20 p-2 rounded-lg my-2 shrink-0">
                  {t('solicitudesCambio.modal.limitReached', 'Límite de mensajes alcanzado. Revisá la respuesta del asistente.')}
                </div>
              )}

              {/* Ready for Jira action */}
              {readyForJira && !jiraIssueKey && (
                <div className="flex items-center justify-between gap-4 bg-primary/10 border border-primary/20 p-3 rounded-xl mt-3 shrink-0">
                  <span className="font-medium text-sm text-primary flex items-center gap-2">
                    ✅ {t('solicitudesCambio.modal.readyToSend', 'Ticket listo — podés revisarlo y ajustarlo antes de enviarlo')}
                  </span>
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors ml-auto mt-2 sm:mt-0"
                    onClick={() => setShowConfirm(true)}
                  >
                    {t('solicitudesCambio.modal.viewAndConfirm', 'Ver y confirmar')} <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* Input */}
              {!jiraIssueKey && (
                <div className="shrink-0">
                  <ChatInput
                    onSend={handleSend}
                    disabled={isSending || limitAlcanzado || isEnviando}
                    placeholder={
                      limitAlcanzado
                        ? t('solicitudesCambio.modal.limitReachedShort', 'Límite de mensajes alcanzado')
                        : solicitud?.estado === EstadoSolicitudCambio.NeedsInfo && mensajes.length > 0
                          ? t('solicitudesCambio.modal.replyToAssistant', 'Respondé las preguntas del asistente...')
                          : t('solicitudesCambio.modal.inputPlaceholder', 'Describí el cambio que necesitás...')
                    }
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
