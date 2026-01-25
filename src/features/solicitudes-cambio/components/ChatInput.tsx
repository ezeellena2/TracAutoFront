import { useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/shared/ui';

interface ChatInputProps {
  onSend: (content: string) => Promise<unknown>;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled,
  isSending,
  placeholder = 'Escribí tu mensaje...',
}: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || disabled || isSending) return;
      setValue('');
      await onSend(trimmed);
    },
    [value, disabled, isSending, onSend]
  );

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border bg-surface p-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isSending}
        className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-text placeholder-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        aria-label="Mensaje"
      />
      <Button
        type="submit"
        disabled={!value.trim() || disabled || isSending}
        className="shrink-0"
        aria-label="Enviar"
      >
        {isSending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Enviar
          </span>
        ) : (
          <Send size={18} />
        )}
      </Button>
    </form>
  );
}
