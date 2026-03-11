interface SpecItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

export function SpecItem({ icon: IconComp, label, value }: SpecItemProps) {
  return (
    <div className="flex items-start gap-2">
      <IconComp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-medium text-text">{value}</p>
      </div>
    </div>
  );
}
