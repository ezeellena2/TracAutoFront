import { useReservaData } from './useReservaData';
import { useReservaAcciones } from './useReservaAcciones';

export function useReservaDetalle(id: string) {
  const data = useReservaData(id);
  const acciones = useReservaAcciones(id);

  return {
    ...data,
    ...acciones,
  };
}
