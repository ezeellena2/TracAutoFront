import { Search } from 'lucide-react';
import { Card, Input } from '@/shared/ui';

interface DriversFiltersProps {
  buscar: string;
  onBuscarChange: (value: string) => void;
  soloActivos: boolean | null;
  onSoloActivosChange: (value: boolean | null) => void;
}

export function DriversFilters({
  buscar,
  onBuscarChange,
  soloActivos,
  onSoloActivosChange,
}: DriversFiltersProps) {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Buscar por nombre o DNI..."
              value={buscar}
              onChange={(e) => onBuscarChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="soloActivos"
            checked={soloActivos ?? false}
            onChange={(e) => onSoloActivosChange(e.target.checked ? true : null)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="soloActivos" className="text-sm text-text cursor-pointer">
            Solo Activos
          </label>
        </div>
      </div>
    </Card>
  );
}

