import {
  Car,
  Truck,
  Bus,
  Zap,
  Crown,
  Gauge,
  type LucideIcon,
} from 'lucide-react';
import { CategoriaAlquiler } from '@/features/alquileres/types/vehiculoAlquiler';

// Mapeo categoría → ícono (compartido entre CategoriasDestacadas, TarjetaVehiculoAlquiler, etc.)
export const CATEGORIA_ICONS: Record<number, LucideIcon> = {
  [CategoriaAlquiler.Economico]: Car,
  [CategoriaAlquiler.Compacto]: Car,
  [CategoriaAlquiler.Intermedio]: Car,
  [CategoriaAlquiler.Estandar]: Car,
  [CategoriaAlquiler.FullSize]: Car,
  [CategoriaAlquiler.SUV]: Truck,
  [CategoriaAlquiler.Pickup]: Truck,
  [CategoriaAlquiler.Van]: Bus,
  [CategoriaAlquiler.Lujo]: Crown,
  [CategoriaAlquiler.Deportivo]: Gauge,
  [CategoriaAlquiler.Electrico]: Zap,
};
