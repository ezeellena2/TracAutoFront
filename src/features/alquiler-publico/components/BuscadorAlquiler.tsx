import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Button } from '@/shared/ui';
import { SelectorSucursal } from './SelectorSucursal';
import { SelectorFechas, validarHorarioSucursal } from './SelectorFechas';
import type { SucursalPublicaDto, BusquedaParams } from '../types/busqueda';
import type { HorarioSucursalDto } from '@/features/alquileres/types/sucursal';

function buildHorarioHelper(horarios: HorarioSucursalDto[] | undefined): string | undefined {
  if (!horarios?.length) return undefined;

  const hoy = new Date().getDay();
  const horarioHoy = horarios.find(h => h.diaSemana === hoy);
  if (!horarioHoy) return undefined;
  if (horarioHoy.cerrado) return undefined;

  const apertura = horarioHoy.horaApertura.substring(0, 5);
  const cierre = horarioHoy.horaCierre.substring(0, 5);
  return `${apertura} – ${cierre}`;
}

interface BuscadorAlquilerProps {
  sucursales: SucursalPublicaDto[];
  initialParams?: BusquedaParams;
}

export function BuscadorAlquiler({ sucursales, initialParams }: BuscadorAlquilerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [sucursalRecogida, setSucursalRecogida] = useState<SucursalPublicaDto | null>(null);
  const [sucursalDevolucion, setSucursalDevolucion] = useState<SucursalPublicaDto | null>(null);
  const [mismaSucursal, setMismaSucursal] = useState(true);
  const [fechaRecogida, setFechaRecogida] = useState('');
  const [fechaDevolucion, setFechaDevolucion] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const serializedInit = JSON.stringify(initialParams ?? null);

  // Pre-llenar desde params iniciales (página de resultados)
  useEffect(() => {
    const params = serializedInit ? JSON.parse(serializedInit) as BusquedaParams | null : null;
    if (!params || sucursales.length === 0) return;

    const recogida = sucursales.find(s => s.id === params.sucursalRecogidaId);
    if (recogida) setSucursalRecogida(recogida);

    if (params.fechaHoraRecogida) setFechaRecogida(params.fechaHoraRecogida);
    if (params.fechaHoraDevolucion) setFechaDevolucion(params.fechaHoraDevolucion);

    if (params.sucursalDevolucionId) {
      setMismaSucursal(false);
      const devolucion = sucursales.find(s => s.id === params.sucursalDevolucionId);
      if (devolucion) setSucursalDevolucion(devolucion);
    }
  }, [sucursales, serializedInit]);

  // Sucursales que permiten one-way (para el selector de devolución)
  const sucursalesOneWay = useMemo(
    () => sucursales.filter(s => s.permiteOneWay),
    [sucursales]
  );

  // Limpiar sucursal de devolución cuando se activa "misma sucursal"
  useEffect(() => {
    if (mismaSucursal) setSucursalDevolucion(null);
  }, [mismaSucursal]);

  // Validación reactiva de horarios
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    // Validar fecha recogida contra horario de sucursal recogida
    if (fechaRecogida && sucursalRecogida?.horarios?.length) {
      const err = validarHorarioSucursal(fechaRecogida, sucursalRecogida.horarios, t);
      if (err) newErrors.fechaRecogida = err;
    }

    // Validar fecha devolución contra horario de sucursal devolución (o recogida si misma)
    if (fechaDevolucion) {
      const sucDev = mismaSucursal ? sucursalRecogida : sucursalDevolucion;
      if (sucDev?.horarios?.length) {
        const err = validarHorarioSucursal(fechaDevolucion, sucDev.horarios, t);
        if (err) newErrors.fechaDevolucion = err;
      }

      // Validar que devolución sea posterior a recogida
      if (fechaRecogida && fechaDevolucion <= fechaRecogida) {
        newErrors.fechaDevolucion = t('alquilerPublico.validacion.devolucionAnterior');
      }
    }

    setErrors(newErrors);
  }, [fechaRecogida, fechaDevolucion, sucursalRecogida, sucursalDevolucion, mismaSucursal, t]);

  const horarioHelper = useMemo(
    () => buildHorarioHelper(sucursalRecogida?.horarios),
    [sucursalRecogida]
  );

  const handleFechaChange = useCallback((campo: 'fechaRecogida' | 'fechaDevolucion', valor: string) => {
    if (campo === 'fechaRecogida') setFechaRecogida(valor);
    else setFechaDevolucion(valor);
  }, []);

  // Puede buscar si tiene todos los campos requeridos y no hay errores
  const puedesBuscar = useMemo(() => {
    if (!sucursalRecogida) return false;
    if (!fechaRecogida || !fechaDevolucion) return false;
    if (!mismaSucursal && !sucursalDevolucion) return false;
    if (Object.keys(errors).length > 0) return false;
    return true;
  }, [sucursalRecogida, sucursalDevolucion, mismaSucursal, fechaRecogida, fechaDevolucion, errors]);

  const handleBuscar = useCallback(() => {
    if (!puedesBuscar || !sucursalRecogida) return;

    const params = new URLSearchParams();
    params.set('sucursalRecogidaId', sucursalRecogida.id);
    params.set('fechaHoraRecogida', fechaRecogida);
    params.set('fechaHoraDevolucion', fechaDevolucion);

    if (!mismaSucursal && sucursalDevolucion) {
      params.set('sucursalDevolucionId', sucursalDevolucion.id);
    }

    navigate(`/resultados?${params.toString()}`);
  }, [puedesBuscar, sucursalRecogida, sucursalDevolucion, mismaSucursal, fechaRecogida, fechaDevolucion, navigate]);

  return (
    <div className="bg-surface rounded-xl shadow-lg p-6">
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1fr_auto] lg:items-end gap-4">
        {/* Sucursal de recogida */}
        <SelectorSucursal
          sucursales={sucursales}
          value={sucursalRecogida}
          onChange={setSucursalRecogida}
          label={t('alquilerPublico.buscador.sucursalRecogida')}
        />

        {/* Fechas */}
        <SelectorFechas
          fechaRecogida={fechaRecogida}
          fechaDevolucion={fechaDevolucion}
          onChange={handleFechaChange}
          errors={errors}
          horarioHelper={horarioHelper}
        />

        {/* Botón buscar */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleBuscar}
          disabled={!puedesBuscar}
          className="w-full lg:w-auto"
        >
          <Search size={18} className="mr-2" />
          {t('alquilerPublico.buscador.buscar')}
        </Button>
      </div>

      {/* Toggle misma sucursal */}
      <label className="flex items-center gap-2 cursor-pointer select-none mt-4">
        <input
          type="checkbox"
          checked={!mismaSucursal}
          onChange={(e) => setMismaSucursal(!e.target.checked)}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
        />
        <span className="text-sm text-text-muted">
          {t('alquilerPublico.buscador.devolverOtraSucursal')}
        </span>
      </label>

      {/* Sucursal de devolución (condicional) */}
      {!mismaSucursal && (
        <div className="mt-4">
          <SelectorSucursal
            sucursales={sucursalesOneWay}
            value={sucursalDevolucion}
            onChange={setSucursalDevolucion}
            label={t('alquilerPublico.buscador.sucursalDevolucion')}
          />
        </div>
      )}
    </div>
  );
}
