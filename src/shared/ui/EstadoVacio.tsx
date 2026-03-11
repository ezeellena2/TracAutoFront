import { SearchX } from 'lucide-react';

interface EstadoVacioProps {
  titulo?: string;
  descripcion?: string;
  icono?: React.ReactNode;
}

export function EstadoVacio({
  titulo = 'Sin resultados',
  descripcion = 'No se encontraron elementos para mostrar',
  icono,
}: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-text-muted mb-4">
        {icono || <SearchX className="w-16 h-16" />}
      </div>
      <h3 className="text-lg font-semibold text-text mb-2">{titulo}</h3>
      <p className="text-text-muted max-w-md">{descripcion}</p>
    </div>
  );
}
