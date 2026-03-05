import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Paperclip, X } from 'lucide-react';
import { toast } from '@/store/toast.store';

interface ChatInputProps {
  onSend: (contenido: string, imagenBase64?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder }: ChatInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [imagenBase64, setImagenBase64] = useState<string | undefined>(undefined);
  const [imagenPreview, setImagenPreview] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, imagenBase64);
    setValue('');
    setImagenBase64(undefined);
    setImagenPreview(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño (max 4MB)
    if (!file.type.startsWith('image/')) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error(t('solicitudesCambio.chat.imageSizeLimit', 'La imagen no puede superar 4MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // result es "data:image/png;base64,XXXXX"
      // Extraer solo la parte base64
      const base64 = result.split(',')[1];
      setImagenBase64(base64);
      setImagenPreview(result); // URL completa para preview
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagenBase64(undefined);
    setImagenPreview(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4 mt-auto">
      {/* Image preview */}
      {imagenPreview && (
        <div className="relative self-start rounded-lg overflow-hidden border border-border shadow-sm">
          <img src={imagenPreview} alt="Preview" className="max-w-[120px] max-h-[120px] object-cover" />
          <button
            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
            onClick={clearImage}
            aria-label={t('solicitudesCambio.chat.removeImage', 'Quitar imagen')}
            type="button"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-1 pr-2 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/50 transition-all">
        {/* Attach image button */}
        <button
          type="button"
          className="p-2 text-text-muted hover:text-primary transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-surface"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label={t('solicitudesCambio.chat.attachImage', 'Adjuntar imagen')}
          title={t('solicitudesCambio.chat.attachImage', 'Adjuntar imagen')}
        >
          <Paperclip size={18} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />

        <textarea
          className="flex-1 bg-transparent resize-none outline-none text-sm text-text placeholder-text-muted py-2 max-h-32 min-h-[40px] overflow-y-auto"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t('solicitudesCambio.modal.inputPlaceholder', 'Describí el cambio que necesitás...')}
          disabled={disabled}
          rows={1}
        />

        <button
          type="button"
          className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0 disabled:opacity-50 disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label={t('solicitudesCambio.chat.sendMessage', 'Enviar mensaje')}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
