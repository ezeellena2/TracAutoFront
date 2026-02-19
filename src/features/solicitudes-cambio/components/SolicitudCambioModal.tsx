import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, ExternalLink, Loader2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useSolicitudChat } from '../hooks/useSolicitudChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useErrorHandler } from '@/hooks';
import type { SolicitudContext } from '@/store/modoSolicitud.store';
import { SolicitudCambioLimits } from '../constants';

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
  const { getErrorMessage } = useErrorHandler();
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
    <div
      data-tracauto-solicitud-modal
      className="solicitud-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="solicitud-modal">
        {/* Header */}
        <div className="solicitud-modal__header">
          <div className="solicitud-modal__header-info">
            <span className="solicitud-modal__title">{t('solicitudesCambio.modal.changeRequest', 'Solicitud de cambio')}</span>
            {solicitud?.label && (
              <span className="solicitud-modal__label">{solicitud.label}</span>
            )}
          </div>
          <div className="solicitud-modal__header-actions">
            {!jiraIssueKey && (
              <span className="solicitud-modal__counter">
                {mensajesUsuario}/{MAX_MENSAJES_USUARIO} {t('solicitudesCambio.modal.messages', 'mensajes')}
              </span>
            )}
            <button className="solicitud-modal__close" onClick={onClose} aria-label={t('common.close', 'Cerrar')}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Jira enviado */}
        {jiraIssueKey && jiraIssueUrl && (
          <div className="solicitud-modal__jira-success">
            <CheckCircle size={16} className="text-success" />
            <span>{t('solicitudesCambio.modal.ticketCreated', 'Ticket creado:')}</span>
            <a href={jiraIssueUrl} target="_blank" rel="noopener noreferrer" className="solicitud-modal__jira-link">
              {jiraIssueKey} <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* Panel de confirmación */}
        {showConfirm ? (
          <div className="solicitud-modal__confirm-panel">
            <div className="solicitud-modal__confirm-header">
              <button className="solicitud-modal__back-btn" onClick={() => setShowConfirm(false)}>
                <ChevronLeft size={16} /> {t('solicitudesCambio.modal.backToChat', 'Volver al chat')}
              </button>
              <h3 className="solicitud-modal__confirm-title">{t('solicitudesCambio.modal.ticketPreview', 'Vista previa del ticket')}</h3>
            </div>

            <div className="solicitud-modal__confirm-body">
              <div className="solicitud-modal__ticket-field">
                <label>{t('solicitudesCambio.modal.summary', 'Resumen')}</label>
                <p className="solicitud-modal__ticket-summary">{ticketSummary}</p>
              </div>

              {ticketLabels.length > 0 && (
                <div className="solicitud-modal__ticket-field">
                  <label>{t('solicitudesCambio.modal.labels', 'Etiquetas')}</label>
                  <div className="solicitud-modal__ticket-labels">
                    {ticketLabels.map((l) => (
                      <span key={l} className="solicitud-modal__ticket-label">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {ticketDescription && (
                <div className="solicitud-modal__ticket-field">
                  <label>{t('solicitudesCambio.modal.description', 'Descripción')}</label>
                  <div
                    className="solicitud-modal__ticket-description"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(markdownToHtml(ticketDescription)) }}
                  />
                </div>
              )}
            </div>

            <div className="solicitud-modal__confirm-actions">
              <button
                className="solicitud-modal__btn solicitud-modal__btn--secondary"
                onClick={() => setShowConfirm(false)}
              >
                {t('common.cancel', 'Cancelar')}
              </button>
              <button
                className="solicitud-modal__btn solicitud-modal__btn--primary"
                onClick={handleConfirmarYEnviar}
                disabled={isEnviando}
              >
                {isEnviando ? (
                  <><Loader2 size={14} className="spin" /> {t('solicitudesCambio.modal.sending', 'Enviando...')}</>
                ) : (
                  <>{t('solicitudesCambio.modal.confirmAndSend', 'Confirmar y enviar a Jira')}</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Chat messages */}
            <div className="solicitud-modal__messages">
              {mensajes.length === 0 && !isSending && (
                <div className="solicitud-modal__empty">
                  <p>{t('solicitudesCambio.modal.describeChange', 'Describí el cambio que necesitás en')} <strong>{solicitud?.label ?? contexto?.label ?? t('solicitudesCambio.modal.thisElement', 'este elemento')}</strong>.</p>
                  <p className="solicitud-modal__empty-hint">{t('solicitudesCambio.modal.messageLimit', 'Tenés hasta {{max}} mensajes para describir tu solicitud.', { max: MAX_MENSAJES_USUARIO })}</p>
                </div>
              )}
              {mensajes.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              {isSending && (
                <div className="solicitud-modal__typing">
                  <Loader2 size={14} className="spin" /> {t('solicitudesCambio.modal.processing', 'Procesando...')}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
              <div className="solicitud-modal__error">
                <AlertCircle size={14} />
                <span>{getErrorMessage(error)}</span>
              </div>
            )}

            {/* Limit reached message */}
            {limitAlcanzado && !readyForJira && (
              <div className="solicitud-modal__limit-msg">
                {t('solicitudesCambio.modal.limitReached', 'Límite de mensajes alcanzado. Revisá la respuesta del asistente.')}
              </div>
            )}

            {/* Ready for Jira action */}
            {readyForJira && !jiraIssueKey && (
              <div className="solicitud-modal__ready-bar">
                <span className="solicitud-modal__ready-text">
                  ✅ {t('solicitudesCambio.modal.readyToSend', 'Ticket listo para enviar')}
                </span>
                <button
                  className="solicitud-modal__btn solicitud-modal__btn--primary"
                  onClick={() => setShowConfirm(true)}
                >
                  {t('solicitudesCambio.modal.viewAndConfirm', 'Ver ticket y confirmar')} <ChevronRight size={14} />
                </button>
              </div>
            )}

            {/* Input */}
            {!jiraIssueKey && (
              <ChatInput
                onSend={handleSend}
                disabled={isSending || limitAlcanzado || isEnviando}
                placeholder={
                  limitAlcanzado
                    ? t('solicitudesCambio.modal.limitReachedShort', 'Límite de mensajes alcanzado')
                    : t('solicitudesCambio.modal.inputPlaceholder', 'Describí el cambio que necesitás...')
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
