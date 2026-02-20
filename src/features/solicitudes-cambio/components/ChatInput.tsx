import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Paperclip, X } from 'lucide-react';

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
      alert(t('solicitudesCambio.chat.imageSizeLimit', 'La imagen no puede superar 4MB.'));
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
    <div className="solicitud-modal__input-area">
      {/* Image preview */}
      {imagenPreview && (
        <div className="solicitud-modal__image-preview">
          <img src={imagenPreview} alt="Preview" className="solicitud-modal__image-thumb" />
          <button
            className="solicitud-modal__image-remove"
            onClick={clearImage}
            aria-label={t('solicitudesCambio.chat.removeImage', 'Quitar imagen')}
            type="button"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="solicitud-modal__input-row">
        {/* Attach image button */}
        <button
          type="button"
          className="solicitud-modal__attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          aria-label={t('solicitudesCambio.chat.attachImage', 'Adjuntar imagen')}
          title={t('solicitudesCambio.chat.attachImage', 'Adjuntar imagen')}
        >
          <Paperclip size={16} />
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
          className="solicitud-modal__textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t('solicitudesCambio.modal.inputPlaceholder', 'Describí el cambio que necesitás...')}
          disabled={disabled}
          rows={1}
        />

        <button
          type="button"
          className="solicitud-modal__send-btn"
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
