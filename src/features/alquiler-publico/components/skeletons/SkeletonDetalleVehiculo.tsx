/**
 * Skeleton loader que replica el layout de DetalleAlquilerPage.
 * Hero card + specs + sidebar.
 */
export function SkeletonDetalleVehiculo() {
  return (
    <div className="container-app py-6 sm:py-8 animate-pulse">
      {/* Volver */}
      <div className="h-5 w-32 bg-border rounded mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="h-64 sm:h-80 bg-border" />
            <div className="p-4 space-y-2">
              <div className="h-7 w-1/2 bg-border rounded" />
              <div className="h-4 w-24 bg-border rounded" />
            </div>
          </div>
          {/* Specs */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <div className="h-5 w-40 bg-border rounded mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-border rounded" />
                  <div className="space-y-1">
                    <div className="h-3 w-16 bg-border rounded" />
                    <div className="h-4 w-20 bg-border rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Sidebar */}
        <div>
          <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
            <div className="h-5 w-32 bg-border rounded" />
            <div className="h-8 w-full bg-border rounded" />
            <div className="h-8 w-full bg-border rounded" />
            <div className="h-10 w-full bg-border rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
