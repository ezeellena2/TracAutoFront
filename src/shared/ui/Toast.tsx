import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToastStore, Toast } from '@/store/toast.store';

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
};

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-amber-500',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { t } = useTranslation();
  const removeToast = useToastStore((state) => state.removeToast);
  const Icon = icons[toast.type];

  return (
    <div
      role="alert"
      aria-live={toast.type === 'error' || toast.type === 'warning' ? 'assertive' : 'polite'}
      className={`
        flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg
        animate-slide-in-right
        ${colors[toast.type]}
      `}
    >
      <Icon size={20} className={iconColors[toast.type]} />
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="p-1 transition-opacity hover:opacity-70"
        aria-label={t('common.close')}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2" aria-live="polite" role="status">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
