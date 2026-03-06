/**
 * Skeleton loader que replica la forma de TarjetaVehiculoAlquiler.
 * Usado en ResultadosAlquilerPage mientras se cargan los vehiculos.
 */
export function SkeletonTarjetaVehiculo() {
  return (
    <div aria-busy="true" className="bg-surface rounded-xl border border-border overflow-hidden animate-pulse">
      {/* Imagen placeholder */}
      <div className="h-32 bg-border" />
      {/* Contenido */}
      <div className="p-4 space-y-3">
        {/* Titulo */}
        <div className="h-5 w-3/4 bg-border rounded" />
        {/* Specs row */}
        <div className="flex gap-3">
          <div className="h-3 w-12 bg-border rounded" />
          <div className="h-3 w-12 bg-border rounded" />
          <div className="h-3 w-12 bg-border rounded" />
        </div>
        {/* Precios */}
        <div className="space-y-1 pt-2">
          <div className="h-3 w-20 bg-border rounded" />
          <div className="h-6 w-28 bg-border rounded" />
        </div>
        {/* Boton */}
        <div className="h-9 w-full bg-border rounded-lg" />
      </div>
    </div>
  );
}
