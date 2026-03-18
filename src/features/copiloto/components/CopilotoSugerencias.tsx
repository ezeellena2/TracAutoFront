import { useTranslation } from 'react-i18next';

interface CopilotoSugerenciasProps {
  onSugerencia: (texto: string) => void;
}

export function CopilotoSugerencias({ onSugerencia }: CopilotoSugerenciasProps) {
  const { t } = useTranslation();

  const sugerencias = [
    t('copiloto.sugerencia1'),
    t('copiloto.sugerencia2'),
    t('copiloto.sugerencia3'),
    t('copiloto.sugerencia4'),
    t('copiloto.sugerencia5'),
  ];

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {sugerencias.map((s) => (
        <button
          key={s}
          onClick={() => onSugerencia(s)}
          className="px-3 py-1.5 text-sm rounded-full border border-border text-text-muted hover:text-text hover:bg-background transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
