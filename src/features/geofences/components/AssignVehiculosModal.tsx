/**
 * Modal para asignar/desasignar vehículos a una geofence
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorHandler } from '@/hooks';
import { Modal, Button } from '@/shared/ui';
import { Check, X, Search, Loader2 } from 'lucide-react';
import { geofencesApi } from '../api';
import { useToastStore } from '@/store/toast.store';
import type { GeofenceDto } from '../types';

interface VehiculoSimple {
  id: string;
  patente: string;
}

interface AssignVehiculosModalProps {
  isOpen: boolean;
  geofence?: GeofenceDto;
  vehiculos: VehiculoSimple[];
  isLoadingVehiculos: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignVehiculosModal({
  isOpen,
  geofence,
  vehiculos,
  isLoadingVehiculos,
  onClose,
  onAssigned,
}: AssignVehiculosModalProps) {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const toast = useToastStore();
  const [buscar, setBuscar] = useState('');
  const [asignados, setAsignados] = useState<Set<string>>(new Set());
  const [procesando, setProcesando] = useState<string | null>(null);

  // Reset y cargar asignados al abrir
  useEffect(() => {
    let cancelled = false;

    if (isOpen && geofence) {
      setBuscar('');
      // Cargar vehículos actualmente asignados desde el backend
      geofencesApi
        .listarVehiculosAsignados(geofence.id)
        .then((asignadosActuales) => {
          if (!cancelled) {
            setAsignados(new Set(asignadosActuales.map((v) => v.vehiculoId)));
          }
        })
        .catch((err) => {
          if (!cancelled) {
            if (import.meta.env.DEV) console.error('Error al cargar vehículos asignados:', err);
            toast.error(t('geofences.errorCargarAsignados', 'Error al cargar asignaciones actuales'));
            setAsignados(new Set());
          }
        });
    } else if (isOpen) {
      setBuscar('');
      setAsignados(new Set());
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, geofence, toast, t, handleApiError]);

  const vehiculosFiltrados = vehiculos.filter((v) =>
    v.patente.toLowerCase().includes(buscar.toLowerCase())
  );

  const handleToggle = useCallback(
    async (vehiculoId: string) => {
      if (!geofence || procesando) return;

      setProcesando(vehiculoId);
      const estaAsignado = asignados.has(vehiculoId);

      try {
        if (estaAsignado) {
          await geofencesApi.desasignarVehiculo(geofence.id, vehiculoId);
          setAsignados((prev) => {
            const next = new Set(prev);
            next.delete(vehiculoId);
            return next;
          });
          toast.success(t('geofences.vehiculoDesasignado', 'Vehículo desasignado'));
        } else {
          await geofencesApi.asignarVehiculo(geofence.id, vehiculoId);
          setAsignados((prev) => new Set(prev).add(vehiculoId));
          toast.success(t('geofences.vehiculoAsignado', 'Vehículo asignado'));
        }
        onAssigned();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error';
        toast.error(message);
      } finally {
        setProcesando(null);
      }
    },
    [geofence, procesando, asignados, toast, t, onAssigned, handleApiError]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('geofences.asignarVehiculos')}
      size="md"
    >
      <div className="space-y-4">
        {/* Info geofence */}
        {geofence && (
          <div className="bg-surface rounded-lg p-3">
            <span className="text-sm text-text-muted">
              {t('geofences.geozona')}:
            </span>
            <span className="ml-2 font-medium text-text">
              {geofence.nombre}
            </span>
          </div>
        )}

        {/* Buscador */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder={t('geofences.buscarVehiculo', 'Buscar por patente...')}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>

        {/* Lista de vehículos */}
        <div className="max-h-[300px] overflow-y-auto divide-y divide-border rounded-lg border border-border">
          {isLoadingVehiculos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : vehiculosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">
              {t('geofences.sinVehiculos', 'No se encontraron vehículos')}
            </div>
          ) : (
            vehiculosFiltrados.map((v) => {
              const isAsignado = asignados.has(v.id);
              const isProcesando = procesando === v.id;

              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-background/50 transition-colors"
                >
                  <span className="text-sm font-medium text-text">{v.patente}</span>
                  <button
                    onClick={() => handleToggle(v.id)}
                    disabled={!!procesando}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isAsignado
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}
                  >
                    {isProcesando ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isAsignado ? (
                      <X size={14} />
                    ) : (
                      <Check size={14} />
                    )}
                    {isAsignado
                      ? t('geofences.desasignar', 'Desasignar')
                      : t('geofences.asignar', 'Asignar')}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Cerrar */}
        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>
            {t('common.close', 'Cerrar')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
