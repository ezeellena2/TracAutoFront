import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/ui';
import { useSolicitudChat } from '../hooks/useSolicitudChat';
import type { CrKeyContext } from '@/store/modoSolicitud.store';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EstadoSolicitudCambio } from '@/shared/types/api';

interface SolicitudCambioModalProps {
  isOpen: boolean;
  onClose: () => void;
  contexto: CrKeyContext | null;
  solicitudId?: string;
}

export function SolicitudCambioModal({
  isOpen,
  onClose,
  contexto,
  solicitudId,
}: SolicitudCambioModalProps) {
  const { t } = useTranslation();
  const {
    solicitud,
    isLoading,
    enviarMensaje,
    isSending,
    enviarAJira,
    isEnviando,
    errorEnviar,
    error,
  } = useSolicitudChat({
    contexto,
    solicitudId,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contexto ? `${contexto.label}` : t('header.modoSolicitud')}
      size="2xl"
    >
      <div className="flex h-[400px] flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {isLoading && (
            <p className="text-center text-text-muted py-8">{t('solicitudesCambio.modal.loading')}</p>
          )}
          {error && (
            <p className="text-center text-error py-4">
              {(error as Error)?.message ?? t('solicitudesCambio.modal.errorLoading')}
            </p>
          )}
          {!isLoading && solicitud?.mensajes?.length === 0 && !error && (
            <p className="text-center text-text-muted py-8">
              {t('solicitudesCambio.modal.emptyMessage')}
            </p>
          )}
          {solicitud?.mensajes?.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
        </div>

        {/* Input */}
        <ChatInput
          onSend={enviarMensaje}
          disabled={!contexto}
          isSending={isSending}
          placeholder={t('solicitudesCambio.modal.inputPlaceholder')}
        />
      </div>

      {/* Ready for Jira / Enviar a Jira / Jira link */}
      {solicitud?.readyForJira && (
        <div className="mt-4 rounded-lg border border-border bg-background/50 p-3 text-sm text-text">
          {solicitud.jiraIssueKey ? (
            <p>
              <a
                href={solicitud.jiraIssueUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {solicitud.jiraIssueKey}
              </a>
            </p>
          ) : solicitud.estado === EstadoSolicitudCambio.Submitted ? (
            <p className="text-text-muted">
              {t('solicitudesCambio.modal.submitted')}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-text-muted">{t('solicitudesCambio.modal.ready')}</p>
              <button
                type="button"
                onClick={enviarAJira}
                disabled={isEnviando}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isEnviando ? t('solicitudesCambio.modal.sending') : t('solicitudesCambio.modal.sendToJira')}
              </button>
              {errorEnviar && (
                <p className="text-error text-xs">
                  {(errorEnviar as Error)?.message ?? t('solicitudesCambio.modal.errorSending')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
