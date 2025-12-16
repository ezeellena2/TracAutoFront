import { ThemePreset } from '@/config/themePresets';
import { Card } from '@/shared/ui';

export function ThemePresetCard({
  preset,
  onApply,
  isActive = false,
}: {
  preset: ThemePreset;
  onApply: (preset: ThemePreset) => void;
  isActive?: boolean;
}) {
  const swatches = [
    { label: 'Primary', value: preset.colors.primary },
    { label: 'Secondary', value: preset.colors.secondary },
    { label: 'Rol (Admin)', value: preset.colors.roleAdminBg ?? preset.colors.primary },
  ];

  return (
    <button
      type="button"
      onClick={() => onApply(preset)}
      className="text-left w-full"
      aria-pressed={isActive}
    >
      <Card
        className={[
          'p-4 h-full overflow-hidden',
          'transition-colors',
          'hover:border-primary/30',
          isActive ? 'border-primary ring-2 ring-primary/20' : '',
        ].join(' ')}
      >
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <p
              className="font-semibold text-text"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {preset.name}
            </p>
            <p
              className="text-sm text-text-muted mt-1"
              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {preset.description}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {swatches.map((s) => (
                <div
                  key={s.label}
                  title={`${s.label}: ${s.value ?? '(sin definir)'}`}
                  className="w-7 h-7 rounded-md border border-border"
                  style={{ backgroundColor: s.value ?? 'transparent' }}
                />
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2 w-full">Click (preview)</p>
          </div>
        </div>
      </Card>
    </button>
  );
}


