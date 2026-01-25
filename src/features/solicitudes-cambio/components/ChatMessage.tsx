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

export function ChatMessage({ message }: ChatMessageProps) {
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
          <p className="whitespace-pre-wrap break-words">{message.contenido}</p>
        </div>
        <span className="text-xs text-text-muted">
          {formatTime(message.fechaCreacion)}
          {message.readyForJira && ' · ✓ Listo para Jira'}
        </span>
      </div>
    </div>
  );
}
