import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Modal, Input, Button } from '@/shared/ui';
import { conductoresApi } from '@/services/endpoints';
import { toast } from '@/store/toast.store';
import type { ConductorDto } from '../types';

interface EditDriverModalProps {
  isOpen: boolean;
  conductor: ConductorDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDriverModal({ isOpen, conductor, onClose, onSuccess }: EditDriverModalProps) {
  const [form, setForm] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (conductor) {
      setForm({
        nombreCompleto: conductor.nombreCompleto,
        email: conductor.email || '',
        telefono: conductor.telefono || '',
      });
    }
  }, [conductor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conductor) return;

    setIsLoading(true);

    try {
      await conductoresApi.actualizar(conductor.id, {
        nombreCompleto: form.nombreCompleto.trim(),
        email: form.email?.trim() || undefined,
        telefono: form.telefono?.trim() || undefined,
      });
      toast.success('Conductor actualizado correctamente');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const errorMsg = error.response?.data?.detail || 'No se pudo actualizar el conductor';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!conductor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text">Editar Conductor</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre Completo"
            value={form.nombreCompleto}
            onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
            placeholder="Juan Pérez"
            required
          />
          {conductor.dni && (
            <Input
              label="DNI"
              value={conductor.dni}
              disabled
              helperText="El DNI no se puede modificar"
            />
          )}
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="juan@example.com"
          />
          <Input
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="+54 11 1234-5678"
          />

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
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

