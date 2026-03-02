import type { PublicacionPublicaDto } from '../types';
import { TarjetaVehiculo } from './TarjetaVehiculo';

interface GrillaVehiculosProps {
  vehiculos: PublicacionPublicaDto[];
}

export function GrillaVehiculos({ vehiculos }: GrillaVehiculosProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {vehiculos.map((vehiculo) => (
        <TarjetaVehiculo key={vehiculo.id} vehiculo={vehiculo} />
      ))}
    </div>
  );
}
