import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import type { MensajeChatDto } from '@/shared/types/api';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: MensajeChatDto;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Convierte Markdown básico a HTML para mensajes del assistant */
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

export function ChatMessage({ message }: ChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.rol === 'user';

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      data-message-id={message.id}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted'}`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={`flex max-w-[85%] flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`rounded-2xl px-4 py-2 text-sm ${isUser ? 'bg-primary text-white' : 'bg-surface border border-border text-text'}`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.contenido}</p>
          ) : (
            <div
              className="prose prose-sm max-w-none [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(markdownToHtml(message.contenido)) }}
            />
          )}
        </div>
        <span className="text-xs text-text-muted">
          {formatTime(message.fechaCreacion)}
          {message.readyForJira && ` · ✓ ${t('solicitudesCambio.modal.readyForJira', 'Listo para Jira')}`}
        </span>
      </div>
    </div>
  );
}
