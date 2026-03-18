import type { LucideIcon } from 'lucide-react';

interface TelemetryGaugeProps {
  label: string;
  value: number | null;
  unit: string;
  icon: LucideIcon;
  min?: number;
  max?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
}

function getColor(value: number | null, warning?: number, critical?: number): string {
  if (value == null) return 'text-text-muted';
  if (critical != null && value >= critical) return 'text-error';
  if (warning != null && value >= warning) return 'text-warning';
  return 'text-success';
}

function getBarColor(value: number | null, warning?: number, critical?: number): string {
  if (value == null) return 'bg-border';
  if (critical != null && value >= critical) return 'bg-error';
  if (warning != null && value >= warning) return 'bg-warning';
  return 'bg-success';
}

export function TelemetryGauge({
  label,
  value,
  unit,
  icon: Icon,
  min = 0,
  max = 100,
  warningThreshold,
  criticalThreshold,
}: TelemetryGaugeProps) {
  const percentage = value != null ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  const color = getColor(value, warningThreshold, criticalThreshold);
  const barColor = getBarColor(value, warningThreshold, criticalThreshold);

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-text-muted" />
        <span className="text-sm text-text-muted">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>
        {value != null ? value.toFixed(1) : '--'}
        <span className="text-sm font-normal text-text-muted ml-1">{unit}</span>
      </div>
      <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
