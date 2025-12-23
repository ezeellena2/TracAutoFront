import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Modal, Button } from '@/shared/ui';
import { conductoresApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import type { ConductorDto } from '../types';
import type { DispositivoDto } from '@/shared/types/api';

interface AssignDeviceModalProps {
  isOpen: boolean;
  conductor: ConductorDto | null;
  dispositivos: DispositivoDto[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AssignDeviceModal({
  isOpen,
  conductor,
  dispositivos,
  onClose,
  onSuccess,
}: AssignDeviceModalProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDeviceId('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conductor || !selectedDeviceId) {
      toast.error('Debe seleccionar un dispositivo');
      return;
    }

    setIsLoading(true);

    try {
      await conductoresApi.asignarDispositivo(conductor.id, {
        dispositivoId: selectedDeviceId,
      });
      toast.success('Dispositivo asignado correctamente');
      setSelectedDeviceId('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const errorMsg = error.response?.data?.detail || 'No se pudo asignar el dispositivo';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!conductor) return null;

  const dispositivosActivos = dispositivos.filter((d) => d.activo);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">Asignar Dispositivo</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-background rounded-lg border border-border">
            <p className="text-xs text-text-muted mb-1">Conductor</p>
            <p className="font-medium text-text">{conductor.nombreCompleto}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Dispositivo
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Seleccione un dispositivo</option>
              {dispositivosActivos.map((dispositivo) => (
                <option key={dispositivo.id} value={dispositivo.id}>
                  {dispositivo.nombre} {dispositivo.uniqueId ? `(${dispositivo.uniqueId})` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              Selecciona el dispositivo GPS a asignar a este conductor
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !selectedDeviceId} className="flex-1">
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

