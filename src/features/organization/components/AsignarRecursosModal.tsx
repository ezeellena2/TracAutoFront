import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Modal, Button } from '@/shared/ui';
import { organizacionesApi, vehiculosApi, dispositivosApi } from '@/services/endpoints';
import { toast } from '@/store';
import { useErrorHandler } from '@/hooks';
import { VehiculoDto, DispositivoDto } from '@/shared/types/api';

interface AsignarRecursosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  relacionId: string;
  organizacionActualId: string;
}

export function AsignarRecursosModal({
  isOpen,
  onClose,
  onSuccess,
  relacionId,
}: AsignarRecursosModalProps) {
  const { t } = useTranslation();
  const { getErrorMessage } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecursos, setIsLoadingRecursos] = useState(false);

  // Recursos disponibles
  const [vehiculos, setVehiculos] = useState<VehiculoDto[]>([]);
  const [dispositivos, setDispositivos] = useState<DispositivoDto[]>([]);

  // Recursos seleccionados
  const [vehiculosSeleccionados, setVehiculosSeleccionados] = useState<Set<string>>(new Set());
  const [dispositivosSeleccionados, setDispositivosSeleccionados] = useState<Set<string>>(new Set());

  // Cargar recursos disponibles
  useEffect(() => {
    if (isOpen) {
      loadRecursos();
    }
  }, [isOpen]);

  const loadRecursos = async () => {
    try {
      setIsLoadingRecursos(true);

      // Cargar vehículos y dispositivos en paralelo
      const [vehiculosData, dispositivosData] = await Promise.all([
        vehiculosApi.getVehiculos({ numeroPagina: 1, tamanoPagina: 100 }),
        dispositivosApi.getDispositivos({ numeroPagina: 1, tamanoPagina: 100 })
      ]);

      setVehiculos(vehiculosData.items);
      setDispositivos(dispositivosData.items);
    } catch (err) {
      console.error('Error loading resources:', err);
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoadingRecursos(false);
    }
  };

  const handleToggleVehiculo = (vehiculoId: string) => {
    const newSet = new Set(vehiculosSeleccionados);
    if (newSet.has(vehiculoId)) {
      newSet.delete(vehiculoId);
    } else {
      newSet.add(vehiculoId);
    }
    setVehiculosSeleccionados(newSet);
  };

  const handleToggleDispositivo = (dispositivoId: string) => {
    const newSet = new Set(dispositivosSeleccionados);
    if (newSet.has(dispositivoId)) {
      newSet.delete(dispositivoId);
    } else {
      newSet.add(dispositivoId);
    }
    setDispositivosSeleccionados(newSet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (vehiculosSeleccionados.size === 0 && dispositivosSeleccionados.size === 0) {
      toast.error(t('organization.relations.assign.noResourcesSelected'));
      return;
    }

    setIsLoading(true);

    try {
      await organizacionesApi.asignarRecursosARelacion(relacionId, {
        vehiculoIds: vehiculosSeleccionados.size > 0 ? Array.from(vehiculosSeleccionados) : undefined,
        dispositivoIds: dispositivosSeleccionados.size > 0 ? Array.from(dispositivosSeleccionados) : undefined,
      });

      toast.success(t('organization.relations.assign.success'));
      setVehiculosSeleccionados(new Set());
      setDispositivosSeleccionados(new Set());
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setVehiculosSeleccionados(new Set());
    setDispositivosSeleccionados(new Set());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">
            {t('organization.relations.assign.title')}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isLoadingRecursos ? (
            <div className="text-center py-8 text-text-muted">
              {t('common.loading')}...
            </div>
          ) : (
            <>
              {/* Vehículos */}
              <div>
                <h3 className="text-sm font-medium text-text mb-3">
                  {t('organization.relations.assign.vehicles')} ({vehiculos.length})
                </h3>
                <div className="border border-border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {vehiculos.length === 0 ? (
                    <p className="text-sm text-text-muted">
                      {t('organization.relations.assign.noVehicles')}
                    </p>
                  ) : (
                    vehiculos.map((vehiculo) => (
                      <label
                        key={vehiculo.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-surface/50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={vehiculosSeleccionados.has(vehiculo.id)}
                          onChange={() => handleToggleVehiculo(vehiculo.id)}
                          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                        />
                        <span className="text-sm text-text">
                          {vehiculo.patente} - {vehiculo.marca} {vehiculo.modelo}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Dispositivos */}
              <div>
                <h3 className="text-sm font-medium text-text mb-3">
                  {t('organization.relations.assign.devices')} ({dispositivos.length})
                </h3>
                <div className="border border-border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {dispositivos.length === 0 ? (
                    <p className="text-sm text-text-muted">
                      {t('organization.relations.assign.noDevices')}
                    </p>
                  ) : (
                    dispositivos.map((dispositivo) => (
                      <label
                        key={dispositivo.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-surface/50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={dispositivosSeleccionados.has(dispositivo.id)}
                          onChange={() => handleToggleDispositivo(dispositivo.id)}
                          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                        />
                        <span className="text-sm text-text">
                          {dispositivo.nombre || dispositivo.id}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isLoadingRecursos || (vehiculosSeleccionados.size === 0 && dispositivosSeleccionados.size === 0)}
            >
              {isLoading ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

